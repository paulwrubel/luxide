# Refresh Token Implementation Plan

## Overview

Add an OAuth2-style refresh token system so that when a user's JWT expires after 24 hours, the frontend silently refreshes it without user interaction. No full-page redirect, no re-authorization.

**Design decisions:**
- One active refresh token per user (logging in on a new device revokes the old one)
- Reactive: refresh on 401, not preemptively
- Opaque refresh token (not a JWT), stored as SHA-256 hash in the DB
- 30-day refresh token lifetime, reset on each refresh
- Token rotation: each refresh invalidates the old token, issues a new one
- Multi-tab sync via localStorage storage event

---

## 1. Database Migration

### Up migration

```sql
BEGIN;

CREATE TABLE refresh_tokens (
    id INTEGER NOT NULL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash BYTEA NOT NULL UNIQUE,
    issued_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked BOOLEAN NOT NULL
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);

END;
```

### Down migration

```sql
BEGIN;

DROP TABLE refresh_tokens;

END;
```

**Notes:**
- `token_hash` is SHA-256 of the raw opaque token string — if the DB is compromised, hashes are useless
- `ON DELETE CASCADE` cleans up tokens when user is deleted
- No `DEFAULT` values — application owns every column
- No auto-increment — application assigns IDs (same pattern as `renders` and `users` tables)

---

## 2. AuthManager — New Methods

**File:** `src/server/auth_manager.rs`

### Constants

```rust
pub const REFRESH_TOKEN_EXPIRE_AFTER_DAYS: i64 = 30;
```

### `generate_refresh_token(&self, user_id: UserID) -> Result<String, AuthManagerError>`

1. Generate 32 bytes of cryptographically random data (CSPRNG / `OsRng`)
2. Hex-encode to a 64-character string (the raw token returned to caller)
3. SHA-256 hash the raw token bytes
4. Revoke any existing non-revoked refresh token for this user
5. Compute `expires_at = now + 30 days`
6. Assigned the next ID via `storage.get_next_refresh_token_id()`
7. Insert row into `refresh_tokens` table via storage trait
8. Return the raw (unhashed) token string

### `validate_refresh_token(&self, token: &str) -> Result<UserID, AuthManagerError>`

1. SHA-256 hash the provided raw token
2. Look up by `token_hash` where `revoked = false` and `expires_at > now()`
3. Return the `user_id` if found
4. Return error if expired, revoked, or not found

### `revoke_refresh_tokens_for_user(&self, user_id: UserID) -> Result<(), AuthManagerError>`

1. Set `revoked = true` for all rows with matching `user_id` (even if already revoked)

### `rotate_refresh_token(&self, token: &str) -> Result<(String, String), AuthManagerError>`

1. Validate the old refresh token → get `user_id`
2. Revoke the old token (set `revoked = true` where `token_hash` matches)
3. Generate new JWT via existing `generate_new_jwt(user_id)`
4. Generate new refresh token via `generate_refresh_token(user_id)`
5. Return `(new_jwt, new_refresh_token)`

### Implementation approach

These methods delegate to new methods on the `UserStorage` trait:

```rust
async fn get_next_refresh_token_id(&self) -> Result<u32, StorageError>;
async fn create_refresh_token(
    &self, id: u32, user_id: UserID, token_hash: &[u8],
    issued_at: chrono::DateTime<chrono::Utc>, expires_at: chrono::DateTime<chrono::Utc>
) -> Result<(), StorageError>;
async fn find_valid_refresh_token(
    &self, token_hash: &[u8]
) -> Result<Option<(UserID, chrono::DateTime<chrono::Utc>)>, StorageError>;
async fn revoke_refresh_token(&self, token_hash: &[u8]) -> Result<(), StorageError>;
async fn revoke_all_refresh_tokens_for_user(&self, user_id: UserID) -> Result<(), StorageError>;
```

The Postgres storage backend implements these with raw SQL. The InMemory and File backends return errors (not applicable). The AuthManager methods are thin wrappers that handle hashing and call these trait methods.

---

## 3. Auth Callback Handler

**File:** `src/server/handlers/auth_callback.rs`

### Response type change

```rust
pub struct AuthLoginResponse {
    pub token: String,           // JWT access token (24hr)
    pub refresh_token: String,   // opaque refresh token (30 day)
}
```

### Handler change

After the existing JWT generation on line 104, add:

```rust
let refresh_token = state.auth_manager.generate_refresh_token(user.id).await?;
```

Then return both in the response:

```rust
Json(AuthLoginResponse { token, refresh_token })
```

---

## 4. Auth Refresh Handler

**File:** `src/server/handlers/auth_refresh.rs` (new)

### Endpoint

```
POST /api/v1/auth/refresh
No authentication required (the refresh token IS the credential)
```

### Request

```json
{ "refresh_token": "a1b2c3d4e5f6..." }
```

### Response (200 OK)

```json
{ "token": "eyJ...", "refresh_token": "b2c3d4..." }
```

### Response (401 Unauthorized)

```json
{ "code": 401, "message": "refresh token expired or revoked" }
```

### Handler logic

1. Parse `RefreshRequest { refresh_token: String }` from JSON body
2. Call `auth_manager.rotate_refresh_token(refresh_token)`
3. On success: return `200` with `RefreshResponse { token, refresh_token }`
4. On error: return `401` with error JSON

### Request/response types

```rust
#[derive(Deserialize)]
pub struct RefreshRequest {
    pub refresh_token: String,
}

#[derive(Serialize)]
pub struct RefreshResponse {
    pub token: String,
    pub refresh_token: String,
}
```

---

## 5. Router and Handlers Barrel

### `src/server/handlers.rs`

Add:
```rust
mod auth_refresh;
pub use auth_refresh::*;
```

### `src/server/router.rs`

Add to `build_auth_router()`:
```rust
.route("/refresh", post(handlers::auth_refresh))
```

---

## 6. Frontend: Authenticated Fetch Singleton

**File:** `ui/src/utils/authFetch.ts` (new)

### Module-level state

```typescript
let accessToken: string | undefined;
let refreshToken: string | undefined;
let refreshPromise: Promise<boolean> | null = null;
let onTokensRefreshed: ((newAccess: string, newRefresh: string) => void) | undefined;
let onAuthExpired: (() => void) | undefined;
```

### `configureAuthFetch(config)` — called by AuthProvider

Sets the module-level `accessToken`, `refreshToken`, `onTokensRefreshed`, and `onAuthExpired` callbacks.

### `authenticatedFetch(url, init?)` — used by api.ts functions

```typescript
export async function authenticatedFetch(url: string, init?: RequestInit): Promise<Response> {
    // 1. Add Authorization header from current accessToken
    const headers = new Headers(init?.headers);
    if (accessToken) {
        headers.set('Authorization', `Bearer ${accessToken}`);
    }

    let response = await fetch(url, { ...init, headers });

    // 2. If not 401, return as-is
    if (response.status !== 401 || !refreshToken) {
        return response;
    }

    // 3. Multi-tab sync: check if localStorage has newer tokens
    const storedAccess = localStorage.getItem('auth_token');
    if (storedAccess && storedAccess !== accessToken) {
        // Another tab already refreshed — adopt their tokens
        accessToken = storedAccess;
        refreshToken = localStorage.getItem('refresh_token') ?? undefined;
        onTokensRefreshed?.(storedAccess, refreshToken ?? '');
        const retryHeaders = new Headers(init?.headers);
        retryHeaders.set('Authorization', `Bearer ${storedAccess}`);
        return fetch(url, { ...init, headers: retryHeaders });
    }

    // 4. Deduplicate: only one refresh at a time
    if (!refreshPromise) {
        refreshPromise = doRefresh();
    }
    const refreshed = await refreshPromise;

    if (refreshed) {
        // 5. Retry original request with new token
        const retryHeaders = new Headers(init?.headers);
        retryHeaders.set('Authorization', `Bearer ${accessToken}`);
        return fetch(url, { ...init, headers: retryHeaders });
    }

    // 6. Refresh failed — trigger logout
    onAuthExpired?.();
    return response;
}
```

### `doRefresh()` — internal

```typescript
async function doRefresh(): Promise<boolean> {
    try {
        const apiURL = `${window.location.origin}/api/v1`;
        const res = await fetch(`${apiURL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken }),
        });
        if (res.ok) {
            const { token, refresh_token } = await res.json();
            accessToken = token;
            refreshToken = refresh_token;
            onTokensRefreshed?.(token, refresh_token);
            return true;
        }
        return false;
    } catch {
        return false;
    } finally {
        refreshPromise = null;
    }
}
```

---

## 7. Auth Context Type

**File:** `ui/src/providers/Auth/context.ts`

```typescript
export type AuthContextType = {
    token: string | undefined;
    refreshToken: string | undefined;                                     // NEW
    user: User | undefined;
    isAuthenticated: boolean;
    mustGetToken: () => string;
    setAuth: (token: string, refreshToken: string) => void;              // REPLACES setToken
    clearToken: () => void;
};
```

---

## 8. Auth Provider

**File:** `ui/src/providers/Auth/provider.tsx`

### New state

```typescript
const [refreshToken, setRefreshTokenState] = useState<string | undefined>(() => {
    return localStorage?.getItem('refresh_token') ?? undefined;
});
```

### Sync singleton — runs on every token change

```typescript
useEffect(() => {
    configureAuthFetch({
        accessToken: token,
        refreshToken,
        onTokensRefreshed: (newAccess, newRefresh) => {
            // Silent update — don't re-fetch user info, no re-render loop
            localStorage.setItem('auth_token', newAccess);
            localStorage.setItem('refresh_token', newRefresh);
            setTokenState(newAccess);
            setRefreshTokenState(newRefresh);
            // do NOT set user to undefined (avoids unnecessary re-fetch of user info on refresh)
        },
        onAuthExpired: () => {
            clearToken();
        },
    });
}, [token, refreshToken, clearToken]);
```

### `setAuth` replaces `setToken`

```typescript
const setAuth = useCallback((newToken: string, newRefreshToken: string) => {
    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('refresh_token', newRefreshToken);
    setTokenState(newToken);
    setRefreshTokenState(newRefreshToken);
    setUser(undefined); // clear user to trigger re-fetch of user info on login
}, []);
```

### `clearToken` updated

```typescript
const clearToken = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    setTokenState(undefined);
    setRefreshTokenState(undefined);
    setUser(undefined);
}, []);
```

### `fetchUserInfo` call simplified

The `useEffect` that calls `fetchUserInfo` no longer passes `token` (it uses `authenticatedFetch` internally):

```typescript
useEffect(() => {
    if (token && !user) {
        fetchUserInfo()
            .then(setUser)
            .catch((e: unknown) => {
                if (e instanceof Error && e.message === 'Unauthorized') {
                    clearToken();
                } else {
                    setUser(undefined);
                }
            });
    }
}, [token, user, clearToken]);
```

### Context value

```typescript
const value: AuthContextType = {
    token,
    refreshToken,        // NEW
    user,
    isAuthenticated: !!token,
    mustGetToken,
    setAuth,             // REPLACES setToken
    clearToken,
};
```

---

## 9. Auth Callback Page

**File:** `ui/src/views/auth/github/callback/index.tsx`

```typescript
// Before:
const token = await fetchAuthTokenGitHub(code, state);
setToken(token);

// After:
const { token, refreshToken } = await fetchAuthTokenGitHub(code, state);
setAuth(token, refreshToken);
```

---

## 10. API Client

**File:** `ui/src/utils/api.ts`

### `fetchAuthTokenGitHub` — return type change

```typescript
type AuthTokenResponse = {
    token: string;
    refresh_token: string;
};

export async function fetchAuthTokenGitHub(code: string, state: string): Promise<AuthTokenResponse>
```

### All other functions — remove `token` parameter, use `authenticatedFetch`

Every function changes uniformly. Before/after example:

```typescript
// BEFORE
export async function postRender(token: string, config: NormalizedRenderConfig, targetUserID?: number): Promise<PostRenderResponse> {
    const response = await fetch(appendUserID(`${getAPIURL()}/renders`, targetUserID), {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify(renderConfig),
    });
    // ... error handling ...
}

// AFTER
export async function postRender(config: NormalizedRenderConfig, targetUserID?: number): Promise<PostRenderResponse> {
    const response = await authenticatedFetch(appendUserID(`${getAPIURL()}/renders`, targetUserID), {
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
        body: JSON.stringify(renderConfig),
    });
    // ... error handling same ...
}
```

### Complete list of functions losing the `token: string` parameter

| Function | Before | After |
|---|---|---|
| `fetchUserInfo` | `(token, customFetch?)` | `(customFetch?)` |
| `postRender` | `(token, config, targetUserID?)` | `(config, targetUserID?)` |
| `getAllRenders` | `(token, targetUserID?)` | `(targetUserID?)` |
| `getRender` | `(token, renderID, targetUserID?)` | `(renderID, targetUserID?)` |
| `pauseRender` | `(token, renderID, targetUserID?)` | `(renderID, targetUserID?)` |
| `resumeRender` | `(token, renderID, targetUserID?)` | `(renderID, targetUserID?)` |
| `deleteRender` | `(token, renderID, targetUserID?)` | `(renderID, targetUserID?)` |
| `updateRenderTotalCheckpoints` | `(token, renderID, n, targetUserID?)` | `(renderID, n, targetUserID?)` |
| `updateRenderName` | `(token, renderID, name, targetUserID?)` | `(renderID, name, targetUserID?)` |
| `getRenderStats` | `(token, renderID, targetUserID?)` | `(renderID, targetUserID?)` |
| `getLatestCheckpointImage` | `(token, renderID, targetUserID?)` | `(renderID, targetUserID?)` |
| `getAllUsers` | `(token)` | `()` |
| `updateUserRole` | `(token, userID, role)` | `(userID, role)` |
| `updateUserQuotas` | `(token, userID, ...)` | `(userID, ...)` |
| `getStorageUsage` | `(token)` | `()` |

### Unchanged functions

| Function | Reason |
|---|---|
| `navigateToAPILogin` | Never took a token — initiates OAuth flow |
| `fetchAuthTokenGitHub` | Never took a token — exchanges OAuth code (return type changes though) |

---

## 11. Hooks (8 files)

All hooks still call `mustGetToken()` or `useAuth().token` for:
1. **Guard:** ensuring the user is authenticated
2. **Query keys:** including `token` so cached query data re-fetches on token rotation

But they no longer pass `token` to the API functions.

### Files changed

| File | Changes |
|---|---|
| `useRenders.ts` | `getAllRenders(token, targetUserID)` → `getAllRenders(targetUserID)` |
| `useRender.ts` | `getRender(token, renderID, targetUserID)` → `getRender(renderID, targetUserID)` |
| `useRenderMutations.ts` | All 6 mutation calls: remove `token` first argument |
| `useRenderStats.ts` | `getRenderStats(token, renderID, targetUserID)` → `getRenderStats(renderID, targetUserID)` |
| `useLatestCheckpointImage.ts` | `getLatestCheckpointImage(token, renderID, targetUserID)` → `getLatestCheckpointImage(renderID, targetUserID)` |
| `useStorageUsage.ts` | `getStorageUsage(token)` → `getStorageUsage()` |
| `useAllUsers.ts` | `getAllUsers(token)` → `getAllUsers()` |
| `useUserMutations.ts` | `updateUserRole(token, ...)`, `updateUserQuotas(token, ...)` → remove `token` |

### `useEventSource.ts` — No changes

SSE uses `EventSource` (not `fetch`), so the `authenticatedFetch` singleton doesn't apply. It continues to receive `token` from the parent hook. When `token` changes (due to refresh), the `useEffect` dependency re-triggers and reconnects with the new token.

---

## Refresh Sequence (End-to-End)

```
User clicks "Submit" on render form
    │
    ▼
postRender(config)                         [api.ts — no token param]
    │
    ▼
authenticatedFetch(url, init)              [authFetch.ts]
    │
    ▼
fetch(url, { Authorization: Bearer ${accessToken} })
    │
    ├── 200 OK ──► return response
    │
    └── 401 UNAUTHORIZED
            │
            ├── localStorage token ≠ in-memory token?
            │   └── YES: another tab refreshed. Adopt their token, retry request ──► done
            │
            ├── refreshPromise already in flight?
            │   └── YES: await it, then retry or fail
            │
            └── Call POST /api/v1/auth/refresh with refreshToken
                    │
                    ├── 200 { token, refresh_token }
                    │   ├── Update in-memory singleton
                    │   ├── Update localStorage
                    │   ├── Call onTokensRefreshed → React state silently updated
                    │   └── Retry original request with new JWT ──► done
                    │
                    └── 401 (refresh token expired/revoked)
                        ├── Call onAuthExpired → clearToken()
                        └── Return original 401 to caller → user sees error or is redirected
```

---

## What does NOT change

- **`AuthenticatedRouteLayout`** — still redirects to `/login` when `!isAuthenticated`
- **`UserBadge` logout** — still calls `clearToken()` (now also clears refresh token)
- **SSE hooks** — still pass `token` directly, reconnect on token change
- **Admin impersonation** — still works via `?user_id=` query param
- **Query key structure** — still includes token (desired: re-fetch on rotation)
- **Backend `Claims` extractor** — unchanged, still validates JWT on every protected route
- **JWT expiry** — stays at 24 hours
