# Svelte → React Migration Plan

> **Generated:** 2026-05-23
> **Decision:** Vite + React Router SPA, @react-three/fiber, TanStack Form + zod, greenfield-in-parallel

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Current Codebase Inventory](#current-codebase-inventory)
3. [Phase 0: Project Scaffold](#phase-0-project-scaffold)
4. [Phase 1: Shared Domain Logic](#phase-1-shared-domain-logic)
5. [Phase 2: Foundation Components](#phase-2-foundation-components)
6. [Phase 3: Auth & Routing](#phase-3-auth--routing)
7. [Phase 4: Data Layer](#phase-4-data-layer)
8. [Phase 5: Feature Pages](#phase-5-feature-pages)
9. [Phase 6: 3D Scene Preview (R3F)](#phase-6-3d-scene-preview-r3f)
10. [Phase 7: Polish & Switchover](#phase-7-polish--switchover)
11. [Appendix: File Migration Map](#appendix-file-migration-map)

---

## Architecture Overview

### Current (Svelte)
```
ui/
├── src/
│   ├── lib/
│   │   ├── state/auth.svelte.ts     ← global auth (Svelte runes)
│   │   ├── utils/
│   │   │   ├── api.ts               ← API client (vanilla fetch)
│   │   │   ├── math.ts
│   │   │   └── render/              ← domain logic (TYPES, SCHEMAS, NORMALIZERS)
│   │   │       ├── config.ts
│   │   │       ├── camera.ts
│   │   │       ├── geometric.ts
│   │   │       ├── material.ts
│   │   │       ├── parameters.ts
│   │   │       ├── scene.ts
│   │   │       ├── texture.ts
│   │   │       ├── templates.ts
│   │   │       └── utils.ts
│   │   └── *.svelte                 ← shared components
│   └── views/
│       ├── +layout.svelte / .ts
│       ├── +page.svelte
│       ├── login/+page.svelte
│       ├── auth/github/callback/+page.svelte
│       └── (authenticated)/renders/
│           ├── +layout.svelte / .ts
│           ├── +page.svelte          ← renders list
│           ├── [id]/+page.svelte     ← render detail
│           └── new/
│               ├── +page.svelte      ← THE BIG FORM
│               ├── +page.ts          ← superforms init
│               ├── utils.ts          ← form sync logic (most complex)
│               ├── Controls.svelte   ← tabbed sidebar
│               ├── Scene.svelte      ← Threlte/Three.js 3D preview
│               └── *ControlsCard.svelte ← per-entity form cards
```

### Target (React)
```
ui-react/
├── src/
│   ├── utils/                       ← framework-agnostic utilities
│   │   ├── auth.tsx                 ← React context for auth
│   │   ├── api.ts                   ← carried over unchanged
│   │   ├── math.ts
│   │   └── render/                  ← carried over unchanged
│   │       ├── config.ts
│   │       ├── camera.ts
│   │       ├── geometric.ts
│   │       ├── material.ts
│   │       ├── parameters.ts
│   │       ├── scene.ts
│   │       ├── texture.ts
│   │       ├── templates.ts
│   │       └── utils.ts
│   ├── components/                  ← shared UI components
│   │   ├── Layout.tsx
│   │   ├── ControlsCard.tsx
│   │   ├── Separator.tsx
│   │   ├── ui/                      ← form controls
│   │   │   ├── TextInputControl.tsx
│   │   │   ├── TextArrayInputControl.tsx
│   │   │   ├── SelectControl.tsx
│   │   │   ├── RangeControl.tsx
│   │   │   └── ToggleControl.tsx
│   │   └── icons/                   ← property icons
│   │       ├── WarningIconUnaffectedPreview.tsx
│   │       ├── WarningIconInaccuratePreview.tsx
│   │       ├── WarningIconAdvancedProperty.tsx
│   │       └── InfoIconAdditionalInfo.tsx
│   ├── views/                       ← page-level route components
│   │   ├── home.tsx
│   │   ├── login.tsx
│   │   ├── auth-callback.tsx
│   │   ├── renders.tsx              ← renders list
│   │   ├── render-detail.tsx        ← render detail
│   │   └── new-render/              ← THE BIG FORM
│   │       ├── index.tsx
│   │       ├── Controls.tsx         ← tabbed sidebar
│   │       ├── CameraControlsCard.tsx
│   │       ├── ParametersControlsCard.tsx
│   │       ├── GeometricControlsCard.tsx
│   │       ├── MaterialControlsCard.tsx
│   │       ├── TextureControlsCard.tsx
│   │       ├── NewGeometricSpeedDial.tsx
│   │       ├── NewMaterialSpeedDial.tsx
│   │       ├── NewTextureSpeedDial.tsx
│   │       ├── NestedGeometricHeader.tsx
│   │       ├── NestedTextureHeader.tsx
│   │       └── Scene.tsx            ← @react-three/fiber
│   ├── hooks/                       ← TanStack Query hooks
│   │   ├── useRenders.ts
│   │   ├── useRender.ts
│   │   └── useCheckpointImage.ts
│   ├── App.tsx                      ← Router setup
│   └── main.tsx                     ← Entry point
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.ts
```

### Key Architectural Decisions

| Concern          | Decision                              | Rationale                                                      |
| ---------------- | ------------------------------------- | -------------------------------------------------------------- |
| Framework        | Vite + React Router v7 (library mode) | Matches current SPA architecture; no SSR needed                |
| Forms            | TanStack Form + zod adapter           | Same ecosystem as tanstack-query; typed field access           |
| 3D               | @react-three/fiber (R3F)              | Mature, declarative JSX, large ecosystem                       |
| Styling          | Tailwind CSS v4                       | Carried over; same utility classes                             |
| UI Kit           | flowbite-react                        | Drop-in replacement for flowbite-svelte                        |
| Data Fetching    | @tanstack/react-query                 | Same library, different binding                                |
| State Management | React Context + TanStack Query        | Auth context; server state in Query; component state otherwise |
| Validation       | zod                                   | Carried over unchanged                                         |

---

## Current Codebase Inventory

### Total: 59 Svelte/TS files

| Category                                   | Count | Files                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------------------------ | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Domain logic (carried over)**            | 11    | `api.ts`, `math.ts`, `render/config.ts`, `render/camera.ts`, `render/geometric.ts`, `render/material.ts`, `render/parameters.ts`, `render/scene.ts`, `render/texture.ts`, `render/templates.ts`, `render/utils.ts`                                                                                                                                                                                                      |
| **Auth state (rewrite)**                   | 1     | `state/auth.svelte.ts`                                                                                                                                                                                                                                                                                                                                                                                                  |
| **Shared Svelte components (rewrite)**     | 10    | `ControlsCard.svelte`, `Separator.svelte`, `TextInputControl.svelte`, `TextArrayInputControl.svelte`, `SelectControl.svelte`, `RangeControl.svelte`, `ToggleControl.svelte`, `ToggleControlUnbound.svelte`, `OptionalControlUnbound.svelte`, `TextInput.svelte`                                                                                                                                                         |
| **Property icons (rewrite)**               | 4     | `WarningIconUnaffectedPreview.svelte`, `WarningIconInaccuratePreview.svelte`, `WarningIconAdvancedProperty.svelte`, `InfoIconAdditionalInfo.svelte`                                                                                                                                                                                                                                                                     |
| **Layout/routing (rewrite)**               | 4     | `+layout.svelte`, `+layout.svelte` (auth), `+layout.ts`, `+layout.ts` (auth)                                                                                                                                                                                                                                                                                                                                            |
| **Feature pages (rewrite)**                | 6     | `+page.svelte` (home), `login/+page.svelte`, `auth/github/callback/+page.svelte`, `renders/+page.svelte`, `renders/[id]/+page.svelte`, `renders/new/+page.svelte`                                                                                                                                                                                                                                                       |
| **New render sub-components (rewrite)**    | 13    | `new/Controls.svelte`, `new/Scene.svelte`, `new/utils.ts`, `new/CameraControlsCard.svelte`, `new/ParametersControlsCard.svelte`, `new/GeometricControlsCard.svelte`, `new/MaterialControlsCard.svelte`, `new/TextureControlsCard.svelte`, `new/NestedGeometricHeader.svelte`, `new/NestedTextureHeader.svelte`, `new/NewGeometricSpeedDial.svelte`, `new/NewMaterialSpeedDial.svelte`, `new/NewTextureSpeedDial.svelte` |
| **Render detail sub-components (rewrite)** | 2     | `renders/[id]/DisplayRender.svelte`, `renders/[id]/Controls.svelte`                                                                                                                                                                                                                                                                                                                                                     |
| **Config/build**                           | 5     | `package.json`, `tsconfig.json`, `vite.config.ts`, `app.d.ts`, `.eslintrc` / `prettierrc`                                                                                                                                                                                                                                                                                                                               |

### Complexity Heat Map

| File                                | Lines | Complexity | Migration Notes                                                                 |
| ----------------------------------- | ----- | ---------- | ------------------------------------------------------------------------------- |
| `render/geometric.ts`               | 819   | Medium     | Pure TS; field-by-field schema definitions and normalizers. Carried over.       |
| `new/utils.ts`                      | 381   | **HIGH**   | Superforms path sync logic. **ELIMINATED** — TanStack Form makes this obsolete. |
| `new/Scene.svelte`                  | 356   | **HIGH**   | Threlte → R3F. Mesh-building logic reusable; JSX wrapping is new.               |
| `render/material.ts`                | 326   | Medium     | Carried over unchanged.                                                         |
| `render/config.ts`                  | 91    | Low        | Carried over unchanged.                                                         |
| `new/GeometricControlsCard.svelte`  | 246   | Medium     | Form controls with discriminated union switching. TanStack Form simplifies.     |
| `new/+page.svelte`                  | 179   | **HIGH**   | Superforms integration, canvas sizing, onChange handler. Major simplification.  |
| `new/TextureControlsCard.svelte`    | 170   | Medium     | Similar pattern to GeometricControlsCard.                                       |
| `new/MaterialControlsCard.svelte`   | 172   | Medium     | Ditto.                                                                          |
| `render/texture.ts`                 | ~250  | Medium     | Carried over unchanged.                                                         |
| `render/scene.ts`                   | ~80   | Low        | Carried over unchanged.                                                         |
| `render/camera.ts`                  | ~80   | Low        | Carried over unchanged.                                                         |
| `render/parameters.ts`              | ~80   | Low        | Carried over unchanged.                                                         |
| `new/CameraControlsCard.svelte`     | ~80   | Low        | Simple form fields.                                                             |
| `new/ParametersControlsCard.svelte` | ~100  | Low        | Simple form fields.                                                             |
| `renders/+page.svelte`              | 52    | Low        | TanStack Query list with polling.                                               |
| `renders/[id]/+page.svelte`         | 58    | Low        | Two queries, polling.                                                           |
| `lib/utils/api.ts`                  | 333   | Low        | Vanilla fetch. Carried over unchanged.                                          |

---

## Phase 0: Project Scaffold

### 0.1 Initialize Vite + React project

```bash
mkdir ui-react
cd ui-react
npm create vite@latest . -- --template react-ts
```

### 0.2 Install dependencies

```bash
# Core
npm install react react-dom react-router-dom @tanstack/react-query @tanstack/react-form
npm install @tanstack/zod-form-adapter
npm install zod

# 3D
npm install three @react-three/fiber @react-three/drei
npm install -D @types/three

# UI
npm install flowbite-react
npm install -D tailwindcss @tailwindcss/vite

# Dev
npm install -D @types/react @types/react-dom typescript vite
```

### 0.3 Configure Tailwind

Set up `tailwind.config.ts` and `src/index.css` with the same Tailwind v4 configuration as the Svelte project (dark theme, zinc-900 backgrounds, etc.).

### 0.4 Configure Vite

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8080'  // proxy to Rust API
    }
  }
});
```

### 0.5 Set up directory structure

Create all directories matching the target architecture above.

### Deliverables:
- [ ] Project builds with `npm run dev`
- [ ] Tailwind CSS rendering correctly
- [ ] API proxy working

---

## Phase 1: Shared Domain Logic

### 1.1 Copy framework-agnostic files

Copy these files verbatim from `ui/src/lib/` to `ui-react/src/utils/`:

```
ui/src/lib/utils/api.ts          → ui-react/src/utils/api.ts
ui/src/lib/utils/math.ts         → ui-react/src/utils/math.ts
ui/src/lib/utils/render/config.ts    → ui-react/src/utils/render/config.ts
ui/src/lib/utils/render/camera.ts    → ui-react/src/utils/render/camera.ts
ui/src/lib/utils/render/geometric.ts → ui-react/src/utils/render/geometric.ts
ui/src/lib/utils/render/material.ts  → ui-react/src/utils/render/material.ts
ui/src/lib/utils/render/parameters.ts → ui-react/src/utils/render/parameters.ts
ui/src/lib/utils/render/scene.ts     → ui-react/src/utils/render/scene.ts
ui/src/lib/utils/render/texture.ts   → ui-react/src/utils/render/texture.ts
ui/src/lib/utils/render/templates.ts → ui-react/src/utils/render/templates.ts
ui/src/lib/utils/render/utils.ts     → ui-react/src/utils/render/utils.ts
```

### 1.2 Fix imports

Update import paths in these files. Currently they use SvelteKit `$lib/` aliases. Change to relative imports.

- `config.ts` imports from `./camera`, `./geometric`, `./material`, `./parameters`, `./scene`, `./texture`, `./utils` — **no changes needed** (already relative)
- `material.ts` imports from `./config`, `./texture`, `./utils` — **no changes needed**
- `geometric.ts` imports from `./config`, `./material`, `./texture`, `./utils` — **no changes needed**
- `api.ts`: Remove `$lib/` alias usage. Import `RawRenderConfig` and `RenderConfig` from `./render/config` (or add a path alias in tsconfig).

### 1.3 Add TypeScript path alias (optional)

Add to `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Deliverables:
- [ ] All 11 domain files compile without errors
- [ ] Type exports work (`RenderConfig`, `GeometricData`, `MaterialData`, etc.)
- [ ] Zod schemas validate correctly (test with a sample config)

---

## Phase 2: Foundation Components

### 2.1 Auth Context

**File:** `src/utils/auth.tsx`

Convert `ui/src/lib/state/auth.svelte.ts` to a React Context + hook.

Svelte runes → React equivalents:
- `$state(token)` → `useState<string | undefined>(undefined)`
- `$state(user)` → `useState<User | undefined>(undefined)`
- `$state(initialized)` → `useState(false)`
- `setToken()` / `clearToken()` → functions in context value
- `initAuth()` → runs in `useEffect` in the provider

The `.svelte.ts` module pattern becomes:
```typescript
// src/utils/auth.tsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from './api';
import { fetchUserInfo } from '../utils/api';

interface AuthContextType {
  token: string | undefined;
  user: User | undefined;
  isAuthenticated: boolean;
  setToken: (token: string) => void;
  clearToken: () => void;
  validToken: string;  // throws if not authenticated
  validUser: User;     // throws if not authenticated
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | undefined>(
    () => localStorage?.getItem('auth_token') ?? undefined
  );
  const [user, setUser] = useState<User | undefined>(undefined);

  // Fetch user info when token changes
  useEffect(() => {
    if (token && !user) {
      fetchUserInfo(token)
        .then(setUser)
        .catch((e) => {
          if (e instanceof Error && e.message === 'Unauthorized') {
            setTokenState(undefined);
            localStorage?.removeItem('auth_token');
          }
        });
    }
  }, [token]);

  const setToken = useCallback((newToken: string) => {
    localStorage?.setItem('auth_token', newToken);
    setTokenState(newToken);
    setUser(undefined);  // will trigger re-fetch
  }, []);

  const clearToken = useCallback(() => {
    localStorage?.removeItem('auth_token');
    setTokenState(undefined);
    setUser(undefined);
  }, []);

  const value: AuthContextType = {
    token,
    user,
    isAuthenticated: !!token,
    setToken,
    clearToken,
    get validToken() {
      if (!token) throw new Error('Not authenticated');
      return token;
    },
    get validUser() {
      if (!user) throw new Error('Not authenticated');
      return user;
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
```

### 2.2 Form Controls

These are the building blocks for the new render form. Each is a wrapper around TanStack Form's `Field` component + flowbite-react inputs.

#### 2.2.1 TextInputControl

**File:** `src/components/ui/TextInputControl.tsx`

Svelte `TextInputControl.svelte` → React:
- Props: `form` (TanStack Form instance), `field` (field name path), `label`, `valueLabel`, `type`, `step`
- Uses `form.Field` with `field.name` to render a labeled text input
- Svelte's `{#snippet}` (named slots) → React's `children` prop or explicit label props

#### 2.2.2 TextArrayInputControl

**File:** `src/components/ui/TextArrayInputControl.tsx`

Svelte `TextArrayInputControl.svelte` → React:
- Renders a tuple field (e.g., `[x, y, z]`) as multiple inline text inputs
- Each tuple element gets its own sub-field: `field[0]`, `field[1]`, `field[2]`
- Props: `form`, `field`, `label`, `valueLabels` (array of strings), `type`, `unenforcedStep`
- Supports `labelSuffix` slot → React children

#### 2.2.3 SelectControl

**File:** `src/components/ui/SelectControl.tsx`

Svelte `SelectControl.svelte` → React:
- Renders a `<select>` dropdown with items array
- Props: `form`, `field`, `label`, `items: { name: string; value: string }[]`

#### 2.2.4 RangeControl

**File:** `src/components/ui/RangeControl.tsx`

Svelte `RangeControl.svelte` → React:
- Renders a range slider with min/max/step
- Shows current value as text
- Props: `form`, `field`, `label`, `min`, `max`, `step`, `valueLabel`

#### 2.2.5 ToggleControl

**File:** `src/components/ui/ToggleControl.tsx`

Svelte `ToggleControl.svelte` → React:
- Checkbox toggle bound to a boolean field
- Props: `form`, `field`, `label`, `defaultValue`

#### 2.2.6 OptionalControlUnbound & ToggleControlUnbound

**File:** `src/components/ui/OptionalControlUnbound.tsx`
**File:** `src/components/ui/ToggleControlUnbound.tsx`

These are "unbound" controls used in the Svelte code for fields that aren't wired through superforms directly (they manipulate the renderConfig context instead). In TanStack Form, these should be proper form fields. If any remain needed as raw state, use `useState` directly.

### 2.3 Layout Components

#### 2.3.1 Separator

**File:** `src/components/Separator.tsx`

Simple horizontal rule / border element. Props: `className?`

#### 2.3.2 ControlsCard

**File:** `src/components/ControlsCard.tsx`

Expandable card with header (title, type label, chevron toggle) and collapsible body. Uses flowbite-react `Card` + `Heading` + `ChevronDownOutline`/`ChevronUpOutline` icons + Tailwind `transition`.

### 2.4 Property Icons

Simple icon components that render SVG icons with tooltips.

- `WarningIconUnaffectedPreview` → `src/components/icons/WarningIconUnaffectedPreview.tsx`
- `WarningIconInaccuratePreview` → `src/components/icons/WarningIconInaccuratePreview.tsx`
- `WarningIconAdvancedProperty` → `src/components/icons/WarningIconAdvancedProperty.tsx`
- `InfoIconAdditionalInfo` → `src/components/icons/InfoIconAdditionalInfo.tsx`

Each is a simple component returning a flowbite-react icon equivalent. They share the same underlying icon library.

### Deliverables:
- [ ] All form controls render and accept typed field paths
- [ ] Auth context provides token/user to any component
- [ ] Layout components render correctly with Tailwind styles

---

## Phase 3: Auth & Routing

### 3.1 App Shell & Router

**File:** `src/App.tsx`

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './utils/auth';
import Layout from './components/Layout';
import HomePage from './views/home';
import LoginPage from './views/login';
import AuthCallbackPage from './views/auth-callback';
import RendersPage from './views/renders';
import RenderDetailPage from './views/render-detail';
import NewRenderPage from './views/new-render';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/auth/github/callback" element={<AuthCallbackPage />} />
              <Route path="/renders" element={<RendersPage />} />
              <Route path="/renders/:id" element={<RenderDetailPage />} />
              <Route path="/renders/new" element={<NewRenderPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

### 3.2 Layout Component

**File:** `src/components/Layout.tsx`

Equivalent of SvelteKit's `+layout.svelte`:
- Top navigation bar with luxide logo, user info, login/logout button
- Uses `useAuth()` to get `user`, `isAuthenticated`, `clearToken`
- Wraps `<Outlet />` from react-router-dom

### 3.3 Auth Guard (Authenticated Layout)

**File:** `src/components/AuthenticatedLayout.tsx`

Equivalent of `(authenticated)/renders/+layout.ts`:
- Checks `isAuthenticated` from `useAuth()`
- Redirects to `/login` if not authenticated via `<Navigate to="/login" />`
- Wraps `<Outlet />`

Routes `/renders`, `/renders/:id`, `/renders/new` use this layout.

### 3.4 Login Page

**File:** `src/views/login.tsx`

Simple page with a "Login with GitHub" button. Calls `navigateToAPILogin()` from `api.ts`.

### 3.5 Auth Callback Page

**File:** `src/views/auth-callback.tsx`

Handles the OAuth callback:
- Reads `code` and `state` from URL search params
- Calls `fetchAuthTokenGitHub(code, state)` 
- Calls `setToken()` from auth context
- Navigates to `/` on success

### Deliverables:
- [ ] Login flow works end-to-end
- [ ] Auth guard redirects unauthenticated users
- [ ] Auth token persists across page refreshes

---

## Phase 4: Data Layer

### 4.1 TanStack Query Hooks

Create custom hooks for each API call, wrapping `@tanstack/react-query`:

#### useRenders

**File:** `src/hooks/useRenders.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { getAllRenders } from '../utils/api';
import { useAuth } from '../utils/auth';

export function useRenders() {
  const { validToken } = useAuth();
  return useQuery({
    queryKey: ['renders', validToken],
    queryFn: () => getAllRenders(validToken),
    refetchInterval: 1000,  // auto-refresh like Svelte version
  });
}
```

#### useRender

**File:** `src/hooks/useRender.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { getRender } from '../utils/api';
import { useAuth } from '../utils/auth';

export function useRender(renderId: number) {
  const { validToken } = useAuth();
  return useQuery({
    queryKey: ['render', renderId, validToken],
    queryFn: () => getRender(validToken, renderId),
    refetchInterval: 1000,
  });
}
```

#### useCheckpointImage

**File:** `src/hooks/useCheckpointImage.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { getLatestCheckpointImage } from '../utils/api';
import { useAuth } from '../utils/auth';

export function useCheckpointImage(renderId: number) {
  const { validToken } = useAuth();
  return useQuery({
    queryKey: ['checkpointImage', renderId, validToken],
    queryFn: async () => {
      const blob = await getLatestCheckpointImage(validToken, renderId);
      return URL.createObjectURL(blob);
    },
    refetchInterval: 1000,
  });
}
```

### 4.2 Mutations

Create mutation hooks for write operations (in `src/hooks/useRenderMutations.ts`):

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postRender, pauseRender, resumeRender, deleteRender } from '../utils/api';
import { useAuth } from '../utils/auth';

export function useCreateRender() {
  const { validToken } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (config: RenderConfig) => postRender(validToken, config),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['renders'] }),
  });
}

// Similar for pauseRender, resumeRender, deleteRender
```

### Deliverables:
- [ ] All query hooks work and return typed data
- [ ] Auto-refetching (polling) matches Svelte behavior
- [ ] Mutations invalidate queries correctly

---

## Phase 5: Feature Pages

### 5.1 Home Page

**File:** `src/views/home.tsx`

Equivalent of `+page.svelte`:
- Shows user info if authenticated
- Shows login prompt if not authenticated
- Simple; no data fetching except `useAuth().user`

### 5.2 Renders List Page

**File:** `src/views/renders.tsx`

Equivalent of `renders/+page.svelte`:
- Uses `useRenders()` hook
- Shows loading spinner, error alert, or card grid
- Each render card shows `RenderPreviewCard` or `NewRenderCard`
- `canCreateNewRender` derived from user limits

### 5.3 Render Detail Page

**File:** `src/views/render-detail.tsx`

Equivalent of `renders/[id]/+page.svelte`:
- Uses `useRender(id)` and `useCheckpointImage(id)` hooks
- Sidebar with `Controls` (pause/resume/delete buttons, render stats)
- Main area with `DisplayRender` (shows checkpoint image)
- Cleans up object URL on unmount via `useEffect` cleanup

### 5.4 New Render Page — THE BIG ONE

**File:** `src/views/new-render/index.tsx`

This is the most complex page. Here's the detailed breakdown:

#### 5.4.1 Form Setup with TanStack Form

```typescript
import { useForm } from '@tanstack/react-form';
import { zodValidator } from '@tanstack/zod-form-adapter';
import { RenderConfigSchema, type RenderConfig } from '../../utils/render/config';
import { getDefaultRenderConfig } from '../../utils/render/templates';

const form = useForm({
  defaultValues: getDefaultRenderConfig() as RenderConfig,
  validatorAdapter: zodValidator(),
  validators: {
    onChange: RenderConfigSchema,
    // Add user-specific refinements inline:
    // - image_dimensions <= user.max_render_pixel_count
    // - saved_checkpoint_limit <= user.max_checkpoints_per_render
  },
  onSubmit: async ({ value }) => {
    await createRenderMutation.mutateAsync(value as RenderConfig);
  },
});
```

**Key difference from superforms:** TanStack Form gives you direct typed access to `form.state.values` and each field is typed. No path strings. No `structuredClone` gymnastics. No `createSkeletonPath`. The superforms `utils.ts` (381 lines) is **entirely eliminated**.

#### 5.4.2 State Management Strategy

In the Svelte version, there are TWO copies of the data:
1. The superforms `$form` (form state)
2. The `renderConfig` context (used by Scene for 3D preview)

With TanStack Form:
- **Single source of truth:** `form.state.values` IS the render config
- Scene component reads from `form.state.values` (passed as prop or context)
- No synchronization needed — TanStack Form updates its state internally on field changes

If the Scene component needs a stable reference for performance, use `useDeferredValue` or `useMemo` with the form values.

#### 5.4.3 Canvas Sizing

Replace Svelte's `bind:clientWidth` / `bind:clientHeight` with a `useResizeObserver` hook (or `@react-three/drei`'s built-in canvas sizing).

#### 5.4.4 Controls (Tabbed Sidebar)

**File:** `src/views/new-render/Controls.tsx`

Equivalent of `new/Controls.svelte`:
- Uses flowbite-react `Tabs` component
- Tabs: Parameters, Camera, Geometrics, Materials, Textures
- Passes `form` down to each controls card
- Derives `activeGeometricNames`, `topLevelMaterialNames`, `topLevelTextureNames` from form values using `useMemo`

#### 5.4.5 Controls Cards

Each card pattern is identical in Svelte — a discriminated union switch on `data.type`:

**GeometricControlsCard** (`new/GeometricControlsCard.svelte` → `new-render/GeometricControlsCard.tsx`):
- Expandable card (reuses `ControlsCard`)
- Svelte `{#snippet}` blocks become React components or render functions
- `controlsGeometric` renders per-type controls using a switch:
  - `box` → corner1, corner2 fields, material select
  - `list` → render sub-geometrics recursively
  - `rotate_x/y/z` → degrees/radians, sub-geometric
  - `parallelogram` → lower_left, u, v, material select
  - `sphere` → center, radius, material select
  - `triangle` → a, b, c, normals, material select
- Delete button calls `form.setFieldValue('geometrics', newGeometrics)` 
  - Also runs `fixReferences` on the new form value

**MaterialControlsCard** (`new/MaterialControlsCard.svelte` → `new-render/MaterialControlsCard.tsx`):
- Same card pattern
- Per-type: dielectric (IOR + texture selects), lambertian (texture selects), specular (roughness + texture selects)
- Texture selects populate from `Object.keys(form.state.values.textures)`

**TextureControlsCard** (`new/TextureControlsCard.svelte` → `new-render/TextureControlsCard.tsx`):
- Same card pattern  
- Per-type: checker (scale + even/odd sub-textures), image (TODO), solid_color (RGB array)

**ParametersControlsCard** (`new/ParametersControlsCard.svelte` → `new-render/ParametersControlsCard.tsx`):
- Image dimensions, total checkpoints, saved checkpoint limit, scaling truncation, seed, etc.

**CameraControlsCard** (`new/CameraControlsCard.svelte` → `new-render/CameraControlsCard.tsx`):
- Eye location, target location, view up, FOV, defocus angle, focus distance, aperture

#### 5.4.6 Speed Dials (Add New Entity)

**NewGeometricSpeedDial** → `new-render/NewGeometricSpeedDial.tsx`:
- Dropdown to add new geometric (box, sphere, triangle, list, rotate, translate, etc.)
- Calls `form.setFieldValue` to add a default geometric to the `geometrics` record

**NewMaterialSpeedDial** → `new-render/NewMaterialSpeedDial.tsx`:
- Dropdown to add new material (dielectric, lambertian, specular)

**NewTextureSpeedDial** → `new-render/NewTextureSpeedDial.tsx`:
- Dropdown to add new texture (color, checker, image)

#### 5.4.7 Delete Handlers

When a geometric/material/texture is deleted:
1. Remove from the record via `form.setFieldValue`
2. Call `fixReferences` (from `render/utils.ts` or port it) to handle cross-references
3. Remove from active scene's geometric list

#### 5.4.8 Nested Headers

**NestedGeometricHeader** → `new-render/NestedGeometricHeader.tsx`:
- Shows a sub-geometric's name and type as a compact header
- Used inside composite geometries (list, rotate, translate)

**NestedTextureHeader** → `new-render/NestedTextureHeader.tsx`:
- Same pattern for nested textures (checker's even/odd sub-textures)

### Deliverables:
- [ ] All pages render with correct data
- [ ] Navigation between pages works
- [ ] Loading, error, and empty states handled
- [ ] New render form creates a render successfully (POST to API)
- [ ] Form validation matches Svelte behavior
- [ ] Delete handlers update form state and fix references

---

## Phase 6: 3D Scene Preview (R3F)

**File:** `src/views/new-render/Scene.tsx`

This is the largest single rewrite. The Svelte version (`new/Scene.svelte`, 356 lines) uses Threlte's `<T>` component to render Three.js objects. In R3F, you use declarative JSX.

### 6.1 R3F Architecture

```typescript
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, AmbientLight } from '@react-three/drei';

function Scene({ form }: { form: TanStackForm }) {
  const renderConfig = form.state.values;
  const activeScene = getSceneData(renderConfig, renderConfig.active_scene);
  const camera = getCameraData(renderConfig, activeScene.camera);

  return (
    <Canvas>
      <PerspectiveCamera
        makeDefault
        fov={camera.data.vertical_field_of_view_degrees}
        position={camera.data.eye_location}
        up={camera.data.view_up}
      />
      <AmbientLight intensity={0.05} />
      {activeScene.geometrics.map((geoName) => (
        <GeometricRenderer key={geoName} config={renderConfig} name={geoName} />
      ))}
    </Canvas>
  );
}
```

### 6.2 GeometricRenderer Component

Replaces `getGeometricMeshesAndLights()` from Scene.svelte lines 53-203.

The key insight: the Svelte version builds Three.js objects imperatively. In R3F, you render them declaratively. The logic for _what_ to build is identical — only the _rendering_ changes.

```typescript
function GeometricRenderer({ config, name }: { config: RenderConfig; name: string }) {
  const { data } = getGeometricDataSafe(config, name);

  switch (data.type) {
    case 'box': {
      const width = Math.abs(data.a[0] - data.b[0]);
      const height = Math.abs(data.a[1] - data.b[1]);
      const depth = Math.abs(data.a[2] - data.b[2]);
      const position = [
        (data.a[0] + data.b[0]) / 2,
        (data.a[1] + data.b[1]) / 2,
        (data.a[2] + data.b[2]) / 2,
      ];
      return (
        <mesh position={position} castShadow receiveShadow>
          <boxGeometry args={[width, height, depth]} />
          <MaterialResolver config={config} materialRef={data.material} />
        </mesh>
      );
    }
    case 'sphere':
      return (
        <mesh position={data.center} castShadow receiveShadow>
          <sphereGeometry args={[data.radius]} />
          <MaterialResolver config={config} materialRef={data.material} />
        </mesh>
      );
    case 'list':
      return data.geometrics.map((subName) => (
        <GeometricRenderer key={subName} config={config} name={subName} />
      ));
    case 'rotate_x':
      return (
        <group rotation-x={toRadians(data)}>
          <GeometricRenderer config={config} name={data.geometric} />
        </group>
      );
    case 'rotate_y':
      return (
        <group rotation-y={toRadians(data)}>
          <GeometricRenderer config={config} name={data.geometric} />
        </group>
      );
    case 'rotate_z':
      return (
        <group rotation-z={toRadians(data)}>
          <GeometricRenderer config={config} name={data.geometric} />
        </group>
      );
    case 'translate':
      return (
        <group position={data.translation}>
          <GeometricRenderer config={config} name={data.geometric} />
        </group>
      );
    case 'parallelogram': {
      const mesh = createParallelogramMesh(data);
      return <primitive object={mesh} />;
    }
    case 'triangle': {
      const mesh = createTriangleMesh(data);
      return <primitive object={mesh} />;
    }
    case 'obj_model':
      // TODO (was also TODO in Svelte)
      return null;
    case 'constant_volume':
      // TODO (was also TODO in Svelte)
      return null;
  }
}
```

### 6.3 MaterialResolver Component

Replaces `getMaterials()` and `getLightSources()` from Scene.svelte:

```typescript
function MaterialResolver({ config, materialRef }: { config: RenderConfig; materialRef: string }) {
  const { data: materialData } = getMaterialDataSafe(config, materialRef);
  const { data: reflectanceTexture } = getTextureDataSafe(config, materialData.reflectance_texture);
  const { data: emittanceTexture } = getTextureDataSafe(config, materialData.emittance_texture);

  // Build material based on type (lambertian → MeshLambertMaterial, specular → MeshStandardMaterial, etc.)
  // Same logic as current getMaterials() function
  // ...
}
```

### 6.4 Why This Is Cleaner in R3F

| Svelte (Threlte)                                           | React (R3F)                                        |
| ---------------------------------------------------------- | -------------------------------------------------- |
| Imperative `new THREE.Mesh()` then wrap in `<T is={mesh}>` | Declarative `<mesh>` with `<boxGeometry>` children |
| Manual shadow/castReceive on every object                  | `castShadow` / `receiveShadow` props               |
| Custom geometry via `<T is={mesh}>`                        | `<primitive object={mesh}>`                        |
| `<T.AmbientLight>`                                         | `<AmbientLight>` from drei                         |

### 6.5 Canvas Sizing

Replace the Svelte `bind:clientWidth`/`bind:clientHeight` pattern with R3F's built-in responsive canvas or a custom `ResizeObserver` hook:

```typescript
function ResponsiveCanvas({ form, aspectRatio }) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      // Calculate dimensions preserving aspect ratio (same math as Svelte version)
      const containerAspect = width / height;
      if (containerAspect > aspectRatio) {
        setSize({ width: height * aspectRatio, height });
      } else {
        setSize({ width, height: width / aspectRatio });
      }
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [aspectRatio]);

  return (
    <div ref={ref} style={{ width: '100%', height: '100%' }}>
      <div style={{ width: size.width, height: size.height, margin: 'auto' }}>
        <Canvas>
          <Scene form={form} />
        </Canvas>
      </div>
    </div>
  );
}
```

Alternatively, use `<Canvas style={{ width: '100%', height: '100%' }}>` and R3F handles resizing automatically — much simpler than the Svelte version.

### Deliverables:
- [ ] 3D scene renders geometries from form config
- [ ] Camera position/orientation matches config
- [ ] Scene updates reactively when form values change
- [ ] Box, sphere, parallelogram, triangle all render correctly
- [ ] Composite geometries (list, rotate, translate) work
- [ ] Lambertian and specular materials show colors

---

## Phase 7: Polish & Switchover

### 7.0 Static Compilation for Rust Embedding

The Rust backend embeds the UI build output at compile time using the `include_dir!` macro:

```rust
// src/server/router.rs:15
static UI_BUILD_DIR: Dir<'_> = include_dir!("$CARGO_MANIFEST_DIR/ui/build");
```

This means the entire `ui/build/` directory is baked into the Rust binary. The fallback handler (line 49) serves `index.html` for any unmatched path, enabling SPA client-side routing.

**Two options for the React build output:**

| Option | Approach | Rust Changes |
|---|---|---|
| **A: Build to `ui/build/` (Recommended)** | Configure Vite to output to `../ui/build` | None — Rust stays unchanged |
| B: Update Rust path | Keep default `dist/` output, change `include_dir!` path | Change to `ui-react/dist` |

**Option A implementation:**

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    outDir: '../ui/build',
    emptyOutDir: true,
  },
  // ...
});
```

This keeps the Rust server completely unchanged — it continues to embed `ui/build/` regardless of whether Svelte or React produced it.

**Development workflow:**
- Vite dev server runs on `localhost:5173`
- CORS in `router.rs` line 68 already allows `localhost:5173` origins
- API calls to `/api/v1/*` are proxied by Vite (dev) or same-origin (prod)
- No changes to the Rust backend needed at any stage

### 7.1 Build Configuration

- Verify `vite build` produces output compatible with the Rust server's static file serving
- Match the SvelteKit build output directory structure (likely `dist/`)
- Update Rust server to serve from the new static directory (or use a symlink)

### 7.2 Docker Integration

- Update `Dockerfile` to build the React app (multi-stage build)
- The Rust server currently serves static files — verify paths match

### 7.3 Prod API URL

The `getAPIURL()` function in `api.ts` currently replaces the port to `:8080` for dev. Since the Rust server serves both the API and static UI from the same port in production:

- **Dev**: Vite proxy handles `/api` → `localhost:8080` (configured in `vite.config.ts`)
- **Prod**: Same-origin API calls — the UI and API are served from the same Rust binary, so no port replacement is needed.

Update `getBaseURL()` / `getAPIURL()` to detect the environment:

```typescript
function getBaseURL(): string {
  return window.location.origin;
}

function getAPIURL(): string {
  // In production, API and UI are served from the same origin
  // In dev, Vite proxies /api to the Rust backend
  if (import.meta.env.DEV) {
    // Vite dev proxy handles this — return same origin
    return `${getBaseURL()}/api/v1`;
  }
  // Production: same origin
  return `${getBaseURL()}/api/v1`;
}
```

Note: This is simpler than the current Svelte code because Vite's proxy handles the port remapping transparently — the browser calls `/api/v1/*` on `localhost:5173` and Vite forwards to `localhost:8080`. In production, both are on the same port.

### 7.4 Tailwind Theme Alignment

- Ensure the dark theme (zinc-900 backgrounds, zinc-200 text, etc.) matches exactly
- Port any custom CSS from the Svelte project

### 7.5 Testing

Manual smoke tests:
1. Login flow (GitHub OAuth)
2. Renders list (loading, error, empty, populated states)
3. Render detail (polling image, pause/resume/delete)
4. New render form:
   - Add/edit/delete geometrics
   - Add/edit/delete materials
   - Add/edit/delete textures
   - Cross-references survive deletions
   - Validation errors show correctly
   - Create render succeeds
5. 3D preview updates in real-time

### 7.6 Switchover

1. Deploy both UIs to staging (or run side-by-side locally)
2. Test all flows
3. Update the Rust server's static file path to point at the React build
4. Archive the Svelte `ui/` directory (don't delete immediately — keep as reference)
5. Update README, justfile, and any documentation

### Deliverables:
- [ ] Production build succeeds
- [ ] All smoke tests pass
- [ ] Svelte directory archived with clear README

---

## Appendix: File Migration Map

### Carried Over Unchanged (11 files)

| Svelte Source                        | React Target                   | Notes                              |
| ------------------------------------ | ------------------------------ | ---------------------------------- |
| `src/lib/utils/api.ts`               | `src/utils/api.ts`               | Update `getAPIURL()` for prod mode |
| `src/lib/utils/math.ts`              | `src/utils/math.ts`              | No changes                         |
| `src/lib/utils/render/config.ts`     | `src/utils/render/config.ts`     | No changes                         |
| `src/lib/utils/render/camera.ts`     | `src/utils/render/camera.ts`     | No changes                         |
| `src/lib/utils/render/geometric.ts`  | `src/utils/render/geometric.ts`  | No changes                         |
| `src/lib/utils/render/material.ts`   | `src/utils/render/material.ts`   | No changes                         |
| `src/lib/utils/render/parameters.ts` | `src/utils/render/parameters.ts` | No changes                         |
| `src/lib/utils/render/scene.ts`      | `src/utils/render/scene.ts`      | No changes                         |
| `src/lib/utils/render/texture.ts`    | `src/utils/render/texture.ts`    | No changes                         |
| `src/lib/utils/render/templates.ts`  | `src/utils/render/templates.ts`  | No changes                         |
| `src/lib/utils/render/utils.ts`      | `src/utils/render/utils.ts`      | No changes                         |

### Rewrites (by priority)

| Priority | Svelte Source                               | React Target                                   | Complexity |
| -------- | ------------------------------------------- | ---------------------------------------------- | ---------- |
| P0       | `state/auth.svelte.ts`                      | `utils/auth.tsx`                                 | Medium     |
| P0       | `src/app.d.ts`                              | (scaffolded by Vite)                           | Trivial    |
| P1       | `Separator.svelte`                          | `components/Separator.tsx`                     | Trivial    |
| P1       | `ControlsCard.svelte`                       | `components/ControlsCard.tsx`                  | Low        |
| P1       | `RangeControl.svelte`                       | `components/ui/RangeControl.tsx`               | Low        |
| P1       | `TextInputControl.svelte`                   | `components/ui/TextInputControl.tsx`           | Low        |
| P1       | `TextArrayInputControl.svelte`              | `components/ui/TextArrayInputControl.tsx`      | Medium     |
| P1       | `SelectControl.svelte`                      | `components/ui/SelectControl.tsx`              | Low        |
| P1       | `ToggleControl.svelte`                      | `components/ui/ToggleControl.tsx`              | Low        |
| P1       | `ToggleControlUnbound.svelte`               | `components/ui/ToggleControl.tsx` (merge)      | Low        |
| P1       | `OptionalControlUnbound.svelte`             | `components/ui/OptionalControl.tsx`            | Low        |
| P1       | `TextInput.svelte`                          | (use flowbite-react TextInput)                 | Trivial    |
| P1       | 4× property icon `.svelte`                  | `components/icons/*.tsx`                       | Trivial    |
| P2       | `+layout.svelte`                            | `components/Layout.tsx`                        | Medium     |
| P2       | `+page.svelte` (home)                       | `views/home.tsx`                              | Low        |
| P2       | `login/+page.svelte`                        | `views/login.tsx`                             | Low        |
| P2       | `auth/github/callback/+page.svelte`         | `views/auth-callback.tsx`                     | Low        |
| P2       | `renders/+page.svelte`                      | `views/renders.tsx`                           | Low        |
| P2       | `renders/RenderPreviewCard.svelte`          | `views/RenderPreviewCard.tsx`                 | Low        |
| P2       | `renders/NewRenderCard.svelte`              | `views/NewRenderCard.tsx`                     | Low        |
| P2       | `UserInfo.svelte`                           | `components/UserInfo.tsx`                      | Low        |
| P2       | `LoginButton.svelte`                        | `components/LoginButton.tsx`                   | Low        |
| P3       | `renders/[id]/+page.svelte`                 | `views/render-detail.tsx`                     | Medium     |
| P3       | `renders/[id]/DisplayRender.svelte`         | `views/DisplayRender.tsx`                     | Low        |
| P3       | `renders/[id]/Controls.svelte`              | `views/RenderControls.tsx`                    | Low        |
| P4       | `renders/new/+page.svelte`                  | `views/new-render/index.tsx`                  | HIGH       |
| P4       | `renders/new/+page.ts`                      | (inline in index.tsx — TanStack Form init)     | HIGH       |
| P4       | `renders/new/utils.ts`                      | **ELIMINATED** (TanStack Form handles this)    | N/A        |
| P4       | `renders/new/Controls.svelte`               | `views/new-render/Controls.tsx`               | Medium     |
| P4       | `renders/new/CameraControlsCard.svelte`     | `views/new-render/CameraControlsCard.tsx`     | Low        |
| P4       | `renders/new/ParametersControlsCard.svelte` | `views/new-render/ParametersControlsCard.tsx` | Low        |
| P4       | `renders/new/GeometricControlsCard.svelte`  | `views/new-render/GeometricControlsCard.tsx`  | Medium     |
| P4       | `renders/new/MaterialControlsCard.svelte`   | `views/new-render/MaterialControlsCard.tsx`   | Medium     |
| P4       | `renders/new/TextureControlsCard.svelte`    | `views/new-render/TextureControlsCard.tsx`    | Medium     |
| P4       | `renders/new/NestedGeometricHeader.svelte`  | `views/new-render/NestedGeometricHeader.tsx`  | Low        |
| P4       | `renders/new/NestedTextureHeader.svelte`    | `views/new-render/NestedTextureHeader.tsx`    | Low        |
| P4       | `renders/new/NewGeometricSpeedDial.svelte`  | `views/new-render/NewGeometricSpeedDial.tsx`  | Low        |
| P4       | `renders/new/NewMaterialSpeedDial.svelte`   | `views/new-render/NewMaterialSpeedDial.tsx`   | Low        |
| P4       | `renders/new/NewTextureSpeedDial.svelte`    | `views/new-render/NewTextureSpeedDial.tsx`    | Low        |
| P5       | `renders/new/Scene.svelte`                  | `views/new-render/Scene.tsx`                  | HIGH       |

### Key Simplification: The Superforms Elimination

The entire `renders/new/utils.ts` (381 lines) is **eliminated** because TanStack Form provides:
- Typed field access (no path-string parsing)
- Direct value get/set (no `structuredClone` snapshotting)
- Built-in validation (no manual `fieldIsValid` calls)
- Automatic state management (no dual `$form` / `renderConfig` sync)

Functions eliminated:
- `updateFieldIfValid()` — TanStack Form handles this
- `updateFields()` — TanStack Form handles this
- `fieldIsValid()` — TanStack Form handles this
- `syncronizeRenderConfig()` — no sync needed; single source of truth
- `createSkeletonPath()` — no path-string construction needed
- `updateField()` — TanStack Form handles this
- `fixReferences()` — logic still needed, but simplified (works on typed objects, not path strings)
- `RenderConfigContext` type — eliminated (single source of truth)

Functions kept:
- `createTriangleMesh()` — pure Three.js, framework-agnostic
- `createParallelogramMesh()` — pure Three.js, framework-agnostic
- `fixReferences()` — port logic to work with typed objects

---

## Estimated Effort by Phase

| Phase     | Description            | Est. Effort     | Critical Path?                |
| --------- | ---------------------- | --------------- | ----------------------------- |
| 0         | Project Scaffold       | 2-4 hours       | Yes                           |
| 1         | Shared Domain Logic    | 1-2 hours       | Yes                           |
| 2         | Foundation Components  | 6-10 hours      | Yes                           |
| 3         | Auth & Routing         | 4-6 hours       | Yes                           |
| 4         | Data Layer             | 2-4 hours       | No (can overlap with Phase 5) |
| 5         | Feature Pages          | 12-20 hours     | Yes                           |
| 6         | 3D Scene Preview (R3F) | 6-10 hours      | No (can be done last)         |
| 7         | Polish & Switchover    | 2-4 hours       | Yes                           |
| **Total** |                        | **35-60 hours** |                               |

Most effort is in Phase 5 (new render form — the big one) and Phase 2 (form controls — you need these before anything else works).

---

## Risks & Mitigations

| Risk                            | Impact | Mitigation                                                                                                                |
| ------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------- |
| R3F learning curve              | Medium | The mesh-building logic is reusable; only the wrapping changes. Start with a spike: render a single box from form config. |
| TanStack Form API unfamiliarity | Low    | Same ecosystem as TanStack Query; similar patterns. The form controls are thin wrappers.                                  |
| flowbite-react API differences  | Low    | Same design system, similar component APIs. Check flowbite-react docs for any breaking changes.                           |
| TypeScript path alias issues    | Low    | Use Vite's `resolve.alias` matching the tsconfig paths.                                                                   |
| Object URL memory leaks         | Low    | React's `useEffect` cleanup is more explicit than Svelte's `onDestroy`. Same pattern.                                     |

---

## Decisions to Revisit During Migration

1. **TanStack Form field path API**: During implementation, you might prefer nested form components over the field path approach. Both work. The plan above uses field paths to match the Svelte pattern, but nested forms might be cleaner for the discriminated union geometry/material/texture cards.

2. **Scene reactivity**: R3F re-renders can be expensive. Consider `React.memo` on `GeometricRenderer` and use `useMemo` for mesh/material construction.

3. **`fixReferences` port**: Currently it modifies objects in place (mutating). In React, prefer immutable updates. Consider returning a new object instead.

4. **Form validation refinements**: The Svelte version adds user-specific refinements (max pixel count, max checkpoints) at form creation time. In TanStack Form, these can be `onChange` validators that access the auth context via `useAuth()`.

---

*End of migration plan. This document should be checked into the repository for reference across sessions.*