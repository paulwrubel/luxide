# Refresh Token Implementation Plan

## Overview

Add an OAuth2-style refresh token system so that when a user's JWT expires after 24 hours, the frontend silently refreshes it without user interaction.

**Token storage model:**
- **Access token (JWT)**: 24-hour lifetime, stored in JS memory only. Lost on page reload, recovered via refresh token.
- **Refresh token**: 30-day lifetime, opaque random string, stored as SHA-256 hash in Postgres. Delivered to browser as an **httpOnly, Secure, SameSite=Lax cookie**. Never accessible to JavaScript. Automatically sent by browser on requests to the API origin.

**Design decisions:**
- Reactive: refresh on 401, not preemptively (no JWT decoding in the browser)
- Multi-token per user: logging in on a new device does not kill existing sessions
- Token rotation: each refresh revokes the old refresh token and issues a new one (same origin_id lineage)
- Reuse detection: presenting a stale/revoked refresh token revokes the entire origin lineage
- Cookie-based refresh: `POST /api/v1/auth/refresh` requires no request body — the refresh token is in the cookie

---

## 1. Database Migration

### `migrations/20260702052852_add_refresh_tokens.up.sql`

```sql
BEGIN;

CREATE TABLE refresh_tokens (
    id INTEGER NOT NULL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash BYTEA NOT NULL UNIQUE,
    origin_id INTEGER NOT NULL,
    issued_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked BOOLEAN NOT NULL
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_origin_id ON refresh_tokens(origin_id);

END;
```

### `migrations/...down.sql`

```sql
BEGIN;
DROP TABLE refresh_tokens;
END;
```

**Columns:**
- `id`: application-assigned (MAX+1 pattern, same as `renders` and `users`)
- `token_hash`: SHA-256 of the raw opaque token string
- `origin_id`: ID of the first token in this login's lineage. New login → points to self. Rotation → inherits origin.
- No `DEFAULT` values — application owns every column
- `ON DELETE CASCADE` cleans up tokens when user is deleted

---

## 2. AuthManager — Refresh Token Methods

**File:** `src/server/auth_manager.rs`

### Constants

```rust
pub const JWT_EXPIRE_AFTER_HOURS: i64 = 24;
pub const REFRESH_TOKEN_EXPIRE_AFTER_DAYS: i64 = 30;
```

### `hash_refresh_token(token: &str) -> Vec<u8>`

SHA-256 of the raw token bytes. Private helper.

### `generate_refresh_token(&self, user_id: UserID, origin_id: Option<u32>) -> Result<String, AuthManagerError>`

1. Generate 32 random bytes via `rand::random::<[u8; 32]>()`
2. Hex-encode to 64-character string (the raw token returned to caller)
3. SHA-256 hash the raw token bytes
4. Get next ID from storage
5. `origin_id = origin_id.unwrap_or(id)` — None = new login (self-origin), Some(x) = rotation (inherit origin)
6. Compute `expires_at = now + 30 days`
7. Store row via `storage.create_refresh_token()`
8. Return raw hex-encoded token

### `rotate_refresh_token(&self, token: &str) -> Result<(String, String), AuthManagerError>`

1. Hash the old token
2. Call `storage.get_refresh_token()` — single DB call
3. If None → error (token never existed)
4. If valid (`!revoked && expires_at > now`) → revoke old token, issue new JWT + new refresh token with same origin_id
5. If invalid (revoked or expired) → REUSE DETECTED → call `revoke_refresh_tokens_by_origin(origin_id)` → error

---

## 3. Storage Trait — Refresh Token Methods

**File:** `src/tracing/storage.rs`

### `RefreshTokenRow` struct

```rust
pub struct RefreshTokenRow {
    pub user_id: UserID,
    pub origin_id: u32,
    pub revoked: bool,
    pub expires_at: chrono::DateTime<chrono::Utc>,
}
```

### 5 methods on `UserStorage` trait

| Method | Purpose |
|---|---|
| `get_next_refresh_token_id()` | `SELECT COALESCE(MAX(id), 0) + 1` |
| `create_refresh_token(id, user_id, token_hash, origin_id, issued_at, expires_at)` | INSERT |
| `get_refresh_token(token_hash)` | SELECT full row by hash |
| `revoke_refresh_token(token_hash)` | UPDATE SET revoked=TRUE |
| `revoke_refresh_tokens_by_origin(origin_id)` | UPDATE SET revoked=TRUE for entire lineage |

Implemented on `PostgresStorage`. InMemoryStorage and FileStorage do NOT implement UserStorage (no stubs needed).

---

## 4. OAuth Callback Handler

**File:** `src/server/handlers/auth_callback.rs`

### What changes

Instead of returning `refresh_token` in the JSON body, set it as an httpOnly cookie.

**Response:**
```json
{ "access_token": "eyJ..." }
```

**Cookie set:**
```
Set-Cookie: refresh_token=<opaque-string>; HttpOnly; Secure; SameSite=Lax; Path=/api/v1/auth; Max-Age=2592000
```

- `HttpOnly`: not accessible to JavaScript
- `Secure`: only sent over HTTPS
- `SameSite=Lax`: sent on same-site requests and top-level navigations, not on cross-site POSTs
- `Path=/api/v1/auth`: only sent to auth endpoints (refresh, callback)
- `Max-Age=2592000`: 30 days

**Implementation:** Use the existing `SignedCookieJar` (already used for the OAuth `session_id` cookie). The `Key` for signing is already in `LuxideState`.

**Removed from response:** `refresh_token` is no longer in `AuthLoginResponse`. Remove that field.

### AuthLoginResponse

```rust
pub struct AuthLoginResponse {
    pub access_token: String,
}
```

The `refresh_token` is set as a signed cookie via the cookie jar, not returned in JSON.

---

## 5. Auth Refresh Handler

**File:** `src/server/handlers/auth_refresh.rs`

### Endpoint: `POST /api/v1/auth/refresh`

**Request:** No JSON body needed. The refresh token comes from the `refresh_token` cookie.

**Response (200):**
```json
{ "access_token": "eyJ..." }
```

**New cookie:** A fresh `refresh_token` cookie (rotation — old token revoked, new one issued).

**Response (401):**
```json
{ "code": 401, "message": "refresh token expired or revoked" }
```

### Handler logic

1. Read `refresh_token` from the signed cookie jar
2. If missing → 401
3. Call `auth_manager.rotate_refresh_token(cookie_value)`
4. On success:
   - Set new `refresh_token` cookie with fresh Max-Age
   - Return 200 with new JWT
5. On error → 401

### Request/response types

```rust
// No request body struct needed — token comes from cookie

#[derive(Serialize)]
pub struct RefreshResponse {
    pub access_token: String,
}
```

**No authentication required.** The cookie IS the credential. This endpoint does not use the `Claims` extractor.

### Cookie jar

The handler takes `SignedCookieJar` as an extractor (same as `auth_callback.rs`). Uses `cookie_jar.add(Cookie::build(...))` to set the new cookie.

---

## 6. Router

**File:** `src/server/router.rs`

```rust
fn build_auth_router() -> Router<LuxideState> {
    Router::new()
        .route("/login", get(handlers::auth_login))
        .route("/github/callback", get(handlers::auth_github_callback))
        .route("/refresh", post(handlers::auth_refresh))
        .route("/current_user_info", get(handlers::get_current_user_info))
}
```

---

## 7. Frontend: Auth Context Type

**File:** `ui/src/providers/Auth/context.ts`

```typescript
export type AuthContextType = {
  accessToken: string | undefined;
  user: User | undefined;
  isAuthenticated: boolean;
  authenticatedFetch: typeof fetch;
  setAccessToken: (token: string) => void;
  clearAccessToken: () => void;
};
```

**Removed:** `token`, `refreshToken`, `setAuth`, `setToken`, `mustGetToken`.

**Added:** `accessToken`, `authenticatedFetch`, `setAccessToken`, `clearAccessToken`.

---

## 8. Frontend: Auth Provider

**File:** `ui/src/providers/Auth/provider.tsx`

### State

```typescript
const [accessToken, setAccessTokenState] = useState<string | undefined>(undefined);
const [user, setUser] = useState<User | undefined>(undefined);
const refreshPromiseRef = useRef<Promise<boolean> | null>(null);
```

**No localStorage.** Access token lives in JS memory only.

### Mount-time refresh attempt

```typescript
useEffect(() => {
  if (!accessToken && !user) {
    // Try to recover a session from the refresh cookie
    fetch(`${apiURL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
      .then(async (res) => {
        if (res.ok) {
          const { access_token } = await res.json();
          setAccessTokenState(access_token);
        }
      })
      .catch(() => {});
  }
}, []); // runs once on mount
```

This prevents the `AuthenticatedRouteLayout` from redirecting to `/login` before the refresh has a chance to run.

### `authenticatedFetch`

```typescript
const authenticatedFetch = useCallback(async (url: string, init?: RequestInit): Promise<Response> => {
  const headers = new Headers(init?.headers);
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  let response = await fetch(url, { ...init, headers, credentials: 'include' });

  if (response.status !== 401) {
    return response;
  }

  // Attempt refresh
  if (!refreshPromiseRef.current) {
    refreshPromiseRef.current = (async () => {
      try {
        const refreshRes = await fetch(`${apiURL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });
        if (refreshRes.ok) {
          const { access_token } = await refreshRes.json();
          setAccessTokenState(access_token);
          return true;
        }
        return false;
      } catch {
        return false;
      } finally {
        refreshPromiseRef.current = null;
      }
    })();
  }

  const refreshed = await refreshPromiseRef.current;

  if (refreshed) {
    // Retry with new access token
    const retryHeaders = new Headers(init?.headers);
    retryHeaders.set('Authorization', `Bearer ${accessToken}`);
    return fetch(url, { ...init, headers: retryHeaders, credentials: 'include' });
  }

  // Refresh failed — logout
  clearAccessToken();
  return response;
}, [accessToken, clearAccessToken]);
```

Key differences from the original singleton approach:
- Lives in `AuthProvider` via `useCallback`, not a module-level singleton
- Uses `useRef` for `refreshPromise` deduplication (React-idiomatic)
- Adds `credentials: 'include'` to all fetch calls (sends the cookie)
- No multi-tab sync needed (cookies handle this natively)
- No refreshToken state (it's in the cookie, invisible to JS)

### `setAccessToken`

```typescript
const setAccessToken = useCallback((newToken: string) => {
  setAccessTokenState(newToken);
  setUser(undefined); // trigger user info re-fetch
}, []);
```

### `clearAccessToken`

```typescript
const clearAccessToken = useCallback(() => {
  setAccessTokenState(undefined);
  setUser(undefined);
}, []);
```

### User info fetch

```typescript
useEffect(() => {
  if (accessToken && !user) {
    fetchUserInfo(authenticatedFetch)
      .then(setUser)
      .catch((e) => {
        if (e instanceof Error && e.message === 'Unauthorized') {
          clearAccessToken();
        } else {
          setUser(undefined);
        }
      });
  }
}, [accessToken, user, clearAccessToken, authenticatedFetch]);
```

### Context value

```typescript
const value: AuthContextType = {
  accessToken,
  user,
  isAuthenticated: !!accessToken,
  authenticatedFetch,
  setAccessToken,
  clearAccessToken,
};
```

---

## 9. Frontend: API Client

**File:** `ui/src/utils/api.ts`

### `fetchAuthTokenGitHub` — return type change

No longer returns `refresh_token` (it comes as a cookie set by the backend).

```typescript
type AuthTokenResponse = {
  access_token: string;
};

export async function fetchAuthTokenGitHub(code: string, state: string): Promise<AuthTokenResponse> {
  const response = await fetch(`${getAPIURL()}/auth/github/callback?code=${code}&state=${state}`, {
    credentials: 'include', // so the cookie gets set
  });
  // ...
  return { access_token: tokenResponse.access_token };
}
```

### All other functions — take `fetch` as a parameter

Every function receives a `fetcher` parameter (the `authenticatedFetch` from context):

```typescript
import type { AuthContextType } from '@/providers/Auth/context';

type Fetcher = AuthContextType['authenticatedFetch'];

export async function postRender(
  fetcher: Fetcher,
  config: NormalizedRenderConfig,
  targetUserID?: number,
): Promise<PostRenderResponse> {
  const response = await fetcher(appendUserID(`${getAPIURL()}/renders`, targetUserID), {
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
    body: JSON.stringify(config),
  });
  // error handling unchanged
}
```

### Complete list of functions gaining `fetcher` parameter

| Function | Signature |
|---|---|
| `fetchUserInfo` | `(fetcher, customFetch?)` |
| `postRender` | `(fetcher, config, targetUserID?)` |
| `getAllRenders` | `(fetcher, targetUserID?)` |
| `getRender` | `(fetcher, renderID, targetUserID?)` |
| `pauseRender` | `(fetcher, renderID, targetUserID?)` |
| `resumeRender` | `(fetcher, renderID, targetUserID?)` |
| `deleteRender` | `(fetcher, renderID, targetUserID?)` |
| `updateRenderTotalCheckpoints` | `(fetcher, renderID, n, targetUserID?)` |
| `updateRenderName` | `(fetcher, renderID, name, targetUserID?)` |
| `getRenderStats` | `(fetcher, renderID, targetUserID?)` |
| `getLatestCheckpointImage` | `(fetcher, renderID, targetUserID?)` |
| `getAllUsers` | `(fetcher)` |
| `updateUserRole` | `(fetcher, userID, role)` |
| `updateUserQuotas` | `(fetcher, userID, ...)` |
| `getStorageUsage` | `(fetcher)` |

### Unchanged functions

| Function | Reason |
|---|---|
| `navigateToAPILogin` | Never took credentials — initiates OAuth flow |
| `fetchAuthTokenGitHub` | Only return type changes — response now has `access_token` not `token` |

---

## 10. Frontend: Auth Callback Page

**File:** `ui/src/views/auth/github/callback/index.tsx`

```typescript
// Before:
const token = await fetchAuthTokenGitHub(code, state);
setToken(token);

// After:
const { access_token } = await fetchAuthTokenGitHub(code, state);
setAccessToken(access_token);
```

The refresh token is already set as a cookie by the backend — nothing to do with it.

---

## 11. Frontend: Hooks

### Every hook changes from:
```typescript
const { mustGetToken } = useAuth();
const token = mustGetToken();
// ...
queryFn: () => getRender(token, renderID, targetUserID),
```

### To:
```typescript
const { accessToken, authenticatedFetch } = useAuth();
// guard still present (hooks render inside AuthenticatedRouteLayout)
// ...
queryFn: () => getRender(authenticatedFetch, renderID, targetUserID),
queryKey: renderQueryKey(renderID, accessToken!, targetUserID),
```

The `accessToken` is still in query keys for automatic cache invalidation on rotation.

### 8 hook files changed:
- `useRenders.ts`
- `useRender.ts`
- `useRenderMutations.ts`
- `useRenderStats.ts`
- `useLatestCheckpointImage.ts`
- `useStorageUsage.ts`
- `useAllUsers.ts`
- `useUserMutations.ts`

### `useEventSource.ts` — minor change

The SSE hook receives `accessToken` from the parent hook. It uses it in the `fetch` override for EventSource. No structural change — just the prop name changes from `token` to `accessToken`.

---

## 12. Layouts

### `AuthenticatedRouteLayout`

No change. Still checks `isAuthenticated` (derived from `!!accessToken`). On page reload, the mount-time refresh attempt in `AuthProvider` completes before the route guard redirects.

### `UserBadge`

Logout now calls `clearAccessToken()` which clears memory state. The refresh cookie cannot be cleared by JS — it expires on its own or gets revoked on the next refresh (since the server validates it). For a full logout, we'd want the server to revoke the cookie. Option: `POST /api/v1/auth/logout` that clears the cookie. Or: just clear the JS state and let the cookie expire. For now, `clearAccessToken()` is sufficient.

---

## Refresh Sequence (End-to-End)

```
User on a fresh page load (no access token in memory)
    │
    ▼
AuthProvider mounts → useEffect fires
    │
    ├── POST /api/v1/auth/refresh (credentials: 'include')
    │       Browser auto-sends refresh_token cookie
    │
    ├── 200 { access_token: "eyJ..." }
    │       AuthProvider sets accessToken → isAuthenticated = true
    │       AuthenticatedRouteLayout renders page
    │
    └── 401 → no session → redirect to /login

---

Later: User clicks "Submit" on a render form
    │
    ▼
postRender(authenticatedFetch, config)
    │
    ▼
authenticatedFetch(url, { method: 'POST', body: ... })
    │   Adds Authorization: Bearer ${accessToken}
    │
    ├── 200 → return response ✓
    │
    └── 401 UNAUTHORIZED
            │
            ├── POST /api/v1/auth/refresh (credentials: 'include')
            │       Browser sends refresh_token cookie
            │
            ├── 200 { access_token: "new..." }
            │       New cookie set by backend
            │       accessToken updated in state
            │       Retry original request ✓
            │
            └── 401 → clearAccessToken → redirect to /login
```

---

## What does NOT change

- **JWT expiry**: stays at 24 hours
- **Backend `Claims` extractor**: unchanged
- **Admin impersonation**: unchanged
- **SSE hooks**: reconnects on accessToken change (same mechanism as before)
- **Query key structure**: still includes accessToken for re-fetch on rotation
