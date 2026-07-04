# Refresh Token Implementation Plan

## Overview

Add an OAuth2-style refresh token system so that when a user's JWT expires after 24 hours, the frontend silently refreshes it without user interaction.

**Token storage model:**
- **Access token (JWT)**: 24-hour lifetime, stored in JS memory only (React state). Lost on page reload, recovered via refresh token.
- **Refresh token**: 30-day lifetime, opaque random string, stored as SHA-256 hash in Postgres. Delivered to browser as an **httpOnly, Secure, SameSite=Lax cookie**. Never accessible to JavaScript.

**Design decisions:**
- Reactive: refresh on 401, not preemptively (no JWT decoding in the browser)
- Multi-token per user: logging in on a new device does not kill existing sessions
- Token rotation: each refresh revokes the old refresh token, issues a new one (same origin_id lineage)
- Reuse detection: presenting a stale/revoked refresh token revokes the entire origin lineage
- Cookie-based refresh: `POST /api/v1/auth/refresh` requires no request body — the refresh token is in the cookie
- React Router v7 loader for bootstrap: page-reload session recovery happens in a route loader, which blocks rendering until the refresh resolves — no redirect flash, no `isAuthLoading` boolean

---

## Backend (COMPLETED)

### 1. Database Migration

`migrations/20260702052852_add_refresh_tokens.up.sql`:

```sql
CREATE TABLE refresh_tokens (
    id INTEGER NOT NULL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash BYTEA NOT NULL UNIQUE,
    origin_id INTEGER NOT NULL,
    issued_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked BOOLEAN NOT NULL
);
```

### 2. AuthManager — Refresh Token Methods

| Method | Purpose |
|---|---|
| `hash_refresh_token(token)` | SHA-256 of raw token bytes |
| `generate_refresh_token(user_id, origin_id: Option<u32>)` | Generate 32 random bytes, hash, store. None=login (self-origin), Some=rotation (inherit origin) |
| `rotate_refresh_token(token)` | Hash → get row → if valid: rotate (revoke old, new JWT+refresh). If invalid/orphaned: reuse detected → revoke entire origin → error |

### 3. Storage Trait — 5 methods on `UserStorage`

`get_next_refresh_token_id`, `create_refresh_token`, `get_refresh_token`, `revoke_refresh_token`, `revoke_refresh_tokens_by_origin`

### 4. OAuth Callback — cookie instead of JSON

Response: `{ "access_token": "eyJ..." }`  
Cookie: `Set-Cookie: refresh_token=<value>; HttpOnly; Secure; SameSite=Lax; Path=/api/v1/auth; Max-Age=2592000`

### 5. Auth Refresh Handler — cookie instead of JSON body

`POST /api/v1/auth/refresh` — reads `refresh_token` from cookie jar. On success: new `access_token` in JSON, new `refresh_token` cookie. On failure: 401.

### 6. Router

```rust
.route("/refresh", post(handlers::auth_refresh))
```

---

## Frontend (REVISED — React Router v7 loaders)

### Architectural change

Switch from `<BrowserRouter>` + `<Routes>` (JSX config) to `createBrowserRouter` + `<RouterProvider>` (object config). This enables **route loaders**, which run before rendering and can block navigation. The authenticated layout route gets a `loader` that performs the page-reload session recovery — no `useEffect`, no `isAuthLoading` flag, no redirect flash.

```
Before:
  <BrowserRouter>
    <Routes>
      <Route element={<AuthLayout />}> ... </Route>
    </Routes>
  </BrowserRouter>

After:
  const router = createBrowserRouter([...]);
  <RouterProvider router={router} />
```

`AuthProvider` wraps `<RouterProvider>` so all routes (including loaders' children) have access to context. Loaders run outside the React tree and cannot access context — they do a raw `fetch` call.

---

### Step 1: AuthContext type

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

**Removed:** `token`, `mustGetToken`, `setToken`, `clearToken`.  
**Added:** `accessToken`, `authenticatedFetch`, `setAccessToken`, `clearAccessToken`.

---

### Step 2: App.tsx refactor — `createBrowserRouter`

**File:** `ui/src/App.tsx`

Switch from JSX route config to object config with `createBrowserRouter` + `<RouterProvider>`. The `AuthProvider` wraps `<RouterProvider>`.

```tsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider } from './providers/Auth';

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      // public
      { path: '/', element: <HomePage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/auth/github/callback', element: <AuthCallbackPage /> },

      // authenticated — loader blocks until session verified
      {
        element: <AuthenticatedRouteLayout />,
        loader: authLoader,
        children: [
          { path: '/renders', element: <RendersPage /> },
          { path: '/renders/:id', element: <RenderDetailPage /> },
          { path: '/renders/new', element: <NewRenderPage /> },
        ],
      },

      // admin
      { element: <AdminRouteLayout />, children: [
        { path: '/admin', element: <AdminPage /> },
      ]},
    ],
  },
]);

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
```

`AdminUserOverrideProvider` is removed from the outer wrapper — it lives inside routes that need it (or inside `AuthenticatedRouteLayout`).

`LuxideToaster` stays outside the router.

---

### Step 3: authLoader — new file

**File:** `ui/src/layouts/authLoader.ts`

The bootstrap refresh function, cached at module level so it runs once regardless of how many navigations hit the authenticated layout:

```typescript
import { redirect } from 'react-router-dom';
import { getAPIURL } from '@/utils/api';

let bootstrapPromise: Promise<{ access_token: string } | null> | null = null;

function bootstrapAuth(): Promise<{ access_token: string } | null> {
  if (!bootstrapPromise) {
    bootstrapPromise = fetch(`${getAPIURL()}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    }).then((res) => (res.ok ? res.json() : null))
      .catch(() => null);
  }
  return bootstrapPromise;
}

export async function authLoader() {
  const session = await bootstrapAuth();
  if (!session) {
    throw redirect('/login');
  }
  return session;
}
```

The loader runs before `<AuthenticatedRouteLayout>` renders. If the refresh fails (no cookie, expired, revoked), the loader throws `redirect('/login')` — React Router handles this at the router level, no component ever renders.

---

### Step 4: AuthenticatedRouteLayout

**File:** `ui/src/layouts/AuthenticatedRouteLayout.tsx`

```tsx
import { useEffect } from 'react';
import { Outlet, Navigate, useLoaderData } from 'react-router-dom';
import { useAuth } from '@/providers/Auth';

export function AuthenticatedRouteLayout() {
  const { access_token } = useLoaderData() as { access_token: string };
  const { accessToken, setAccessToken } = useAuth();

  // Bootstrap: pass the loader's token into AuthProvider (runs once on initial entry)
  useEffect(() => {
    if (!accessToken) {
      setAccessToken(access_token);
    }
  }, []);

  // Ongoing guard: redirect if token is cleared (logout, failed refresh)
  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
```

How it works:
1. Router hits `/renders` → `authLoader` runs → `POST /auth/refresh` → resolves
2. If success: `authLoader` returns `{ access_token }` → router renders `<AuthenticatedRouteLayout>`
3. Layout reads `useLoaderData()` → `useEffect` passes token to `AuthProvider` via `setAccessToken`
4. `accessToken` is now set → `isAuthenticated = true` → `<Outlet />` renders
5. If logout/refresh-failure clears `accessToken` → guard catches it → `<Navigate to="/login" />`

---

### Step 5: AuthProvider

**File:** `ui/src/providers/Auth/provider.tsx`

**No localStorage.** Access token in `useState` only.  
**No mount-time useEffect for refresh.** That's the loader's job now.  
**No `isAuthLoading` flag.** The loader handles the initial gap.

```typescript
export function AuthProvider(props: AuthProviderProps) {
  const { children } = props;

  const [accessToken, setAccessTokenState] = useState<string | undefined>(undefined);
  const [user, setUser] = useState<User | undefined>(undefined);
  const refreshPromiseRef = useRef<Promise<boolean> | null>(null);

  const clearAccessToken = useCallback(() => {
    setAccessTokenState(undefined);
    setUser(undefined);
  }, []);

  const setAccessToken = useCallback((newToken: string) => {
    setAccessTokenState(newToken);
    setUser(undefined); // trigger user info re-fetch
  }, []);

  // authenticatedFetch: wraps fetch with auth header and 401 → refresh → retry
  const apiURL = getAPIURL();
  const authenticatedFetch = useCallback(async (url: string, init?: RequestInit): Promise<Response> => {
    const headers = new Headers(init?.headers);
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }

    let response = await fetch(url, { ...init, headers, credentials: 'include' });

    if (response.status !== 401) {
      return response;
    }

    // Deduplicate concurrent refresh attempts
    if (!refreshPromiseRef.current) {
      refreshPromiseRef.current = fetch(`${apiURL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      }).then((res) => {
        if (res.ok) return res.json().then((d) => d.access_token);
        return null;
      }).catch(() => null)
      .finally(() => { refreshPromiseRef.current = null; });
    }

    const newToken: string | null = await refreshPromiseRef.current;

    if (newToken) {
      setAccessTokenState(newToken);
      const retryHeaders = new Headers(init?.headers);
      retryHeaders.set('Authorization', `Bearer ${newToken}`);
      return fetch(url, { ...init, headers: retryHeaders, credentials: 'include' });
    }

    // Refresh failed — logout
    clearAccessToken();
    return response;
  }, [accessToken, clearAccessToken, apiURL]);

  // Fetch user info when accessToken changes
  useEffect(() => {
    if (accessToken && !user) {
      fetchUserInfo(authenticatedFetch)
        .then(setUser)
        .catch((e: unknown) => {
          if (e instanceof Error && e.message === 'Unauthorized') {
            clearAccessToken();
          } else {
            setUser(undefined);
          }
        });
    }
  }, [accessToken, user, clearAccessToken, authenticatedFetch]);

  const value: AuthContextType = {
    accessToken,
    user,
    isAuthenticated: !!accessToken,
    authenticatedFetch,
    setAccessToken,
    clearAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
```

---

### Step 6: API Client

**File:** `ui/src/utils/api.ts`

Every function gains a `fetcher: typeof fetch` parameter (the `authenticatedFetch` from context). No more `token` param, no manual `Authorization` header.

```typescript
type Fetcher = typeof fetch;

// Example — all 15 functions follow this pattern
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

**`fetchAuthTokenGitHub`** return type changes to `{ access_token: string }` (no refresh_token — it's a cookie now). Adds `credentials: 'include'`.

---

### Step 7: Auth Callback Page

**File:** `ui/src/views/auth/github/callback/index.tsx`

```typescript
const { access_token } = await fetchAuthTokenGitHub(code, state);
setAccessToken(access_token);
```

---

### Step 8: Hooks (8 files)

All hooks get `authenticatedFetch` from `useAuth()` and pass it to api.ts functions. `accessToken` stays in query keys for automatic cache invalidation on rotation.

```typescript
// Before:
const { mustGetToken } = useAuth();
const token = mustGetToken();
queryFn: () => getRender(token, renderID, targetUserID),

// After:
const { accessToken, authenticatedFetch } = useAuth();
queryFn: () => getRender(authenticatedFetch, renderID, targetUserID),
queryKey: renderQueryKey(renderID, accessToken!, targetUserID),
```

---

### Step 9: useEventSource

**File:** `ui/src/hooks/useEventSource.ts`

Prop renamed from `token` to `accessToken`. Adds `credentials: 'include'` to the fetch override. No structural change.

---

## Refresh Sequence (End-to-End)

### Page reload recovery
```
User opens /renders in a new tab
  → Router sees /renders matches authenticated layout
  → authLoader runs: POST /api/v1/auth/refresh (cookie auto-sent)
    → Success: loader returns { access_token }
      → Router renders AuthenticatedRouteLayout
      → Layout calls setAccessToken(access_token)
      → isAuthenticated = true → Outlet renders → page visible
    → Failure: loader throws redirect('/login')
      → Router redirects, no component renders, no flash
```

### API call with expired token
```
User clicks "Submit" on render form
  → postRender(authenticatedFetch, config)
    → authenticatedFetch adds Authorization: Bearer {expired_token}
    → Backend returns 401
    → authenticatedFetch calls POST /api/v1/auth/refresh (cookie)
      → Success: new access_token, setAccessToken, retry original request ✓
      → Failure: clearAccessToken → isAuthenticated = false → redirect to /login
```

---

## What does NOT change
- **JWT expiry**: stays at 24 hours
- **Backend `Claims` extractor**: unchanged
- **Admin impersonation**: unchanged
- **SSE hooks**: reconnect on accessToken change
- **Query key structure**: still includes accessToken for re-fetch on rotation
- **UserBadge logout**: calls `clearAccessToken()` (no localStorage to clear)
