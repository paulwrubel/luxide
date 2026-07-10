## 1. Project Overview

Luxide is a **ray tracing render manager** — a multi-tenant platform where users can create, monitor, and manage path-traced renders. It consists of:
- A **Rust backend** (HTTP API server + CLI renderer) with a custom path tracing engine
- A **React SPA frontend** for creating render configurations and monitoring progress

---

## 2. Tech Stack

### Backend (Rust)
- **Web framework**: Axum with tower-http (CORS)
- **Database**: SQLx with PostgreSQL (also supports FileStorage and InMemoryStorage backends)
- **Auth**: GitHub OAuth2 → JWT (RS256, 24hr expiry)
- **Rendering**: Custom path tracing engine in `src/tracing/` (rayon-parallel, tile-based)

### Frontend (React + TypeScript)
- **State/Data**: @tanstack/react-query (server state, SSE-driven updates), @tanstack/react-form + @tanstack/zod-form-adapter (form state)
- **3D Preview**: @react-three/fiber + @react-three/drei + three
- **UI Kit**: flowbite-react — reference: https://flowbite-react.com/llms.txt
- **CSS**: Tailwind CSS v4 (configured entirely in CSS, no config file; dark mode via `.dark` class)

---

## 3. Directory Structure

- `src/` — Rust backend: HTTP API server, CLI renderer, path tracing engine, geometry/shading libraries
- `ui/` — React SPA frontend (active): page views, shared components, hooks, providers, API client utils, layouts
- `migrations/` — SQLx PostgreSQL migrations (9 up/down pairs)

---

## 4. Key Architectural Decisions

- **TanStack Form over alternatives**: Chosen for headless, type-safe form management with Zod schema integration. All render configuration forms use TanStack Form with the Zod adapter.
- **R3F (React Three Fiber) is the React renderer for Three.js**: The 3D scene preview is built with R3F + drei helpers.
- **3D scene preview embedded in `views/renders/new/`**: The 3D preview canvas is tightly coupled to the "new render" creation page rather than being a standalone reusable component. This is because the preview is only needed during scene creation — once a render is submitted, the backend handles the actual path tracing and the UI displays checkpoint images.
- **Trait-based storage backends**: The `RenderStorage` and `UserStorage` traits allow swapping between PostgreSQL, filesystem, and in-memory storage via config. Both the API server and CLI use the same storage abstraction.
- **GitHub OAuth → JWT auth flow**: Users authenticate via GitHub OAuth2. On callback, the server creates/finds the user, issues a RS256-signed JWT (24hr). Subsequent requests use `Authorization: Bearer <token>`. Admin users (defined in secrets) get unlimited resource quotas.
- **Poll-based render manager**: The `RenderManager` polls every 1 second for state transitions (Created → Running → Pausing → Paused → FinishedCheckpointIteration). The frontend receives state updates via SSE (Server-Sent Events) pushed from the API.
- **Resource limits per user**: Regular users have defaults (1 render, 1 checkpoint/render, 250K max pixel count). Admins have no limits.

---

## 5. Development Commands

| Command                         | Description                                                    |
| ------------------------------- | -------------------------------------------------------------- |
| `just run`                      | Build and run via Docker Compose (API + PostgreSQL)            |
| `just run-local`                | Build API + run PostgreSQL, then start API server locally      |
| `just run-ui`                   | Start Docker services + Vite dev server on port 5173           |
| `just run-postgres`             | Start PostgreSQL container + run migrations                    |
| `just build`                    | Build UI + run migrations + build both Rust binaries (release) |
| `just build-api`                | Build UI + run migrations + build luxide-api (release)         |
| `just build-cli`                | Build luxide-cli (release)                                     |
| `just build-ui`                 | Setup Node env + build React UI                                |
| `just clean`                    | Cargo clean + remove ui/dist + stop Docker                     |
| `just generate-jwt-keypair-pem` | Generate RSA keypair for JWT signing                           |

Note: The `just build-api` and `just run` commands embed the UI's `dist/` folder into the Rust binary at compile time via `include_dir!`. The API server serves the React SPA alongside the API routes.

---

## 6. Known Quirks & Conventions

### flowbite-react
- **Compound exports, NOT dot notation**: Use separate named imports: `DropdownItem`, `TabItem`, `SidebarItems`, `SidebarItemGroup` — NOT `Dropdown.Item`, `Tabs.Item`, etc.
- **Button colors**: Use `"default"` not `"primary"`, `"red"` not `"failure"`, `"yellow"` not `"warning"`. These differ from standard Tailwind color naming.
- **`ToggleSwitch` label is string-only**: To render ReactNode icons, place them as siblings next to the ToggleSwitch, not inside the label prop.
- **Card internal padding is `p-6`**: Override with the `theme` prop or use `[&>div]:!p-0` in className.

### Dark Mode
Dark mode requires THREE things simultaneously:
1. **CSS**: `@variant dark (&:where(.dark, .dark *));` in `ui/src/index.css`
2. **JS**: `initThemeMode({ mode: 'dark' })` called in `main.tsx` before React mounts
3. **React tree**: `<ThemeProvider>` wrapping the app in `App.tsx`

### TanStack Form
- **Values require `useSelector`**: Use `useSelector(form.store, selector)` to read form values reactively — NOT `form.state.values`. Example: `const values = useSelector(form.store, (state) => state.values);`

### Tailwind CSS v4
- No `tailwind.config.ts` file exists. All configuration is done via CSS `@theme` block in `ui/src/index.css`.
- Flowbite classes are sourced via `@source '../node_modules/flowbite-react';` in the CSS file.

### Backend
- `luxide.json` and `luxide.secret.json` in the repo root are the API config and secrets files (not checked into git; templates should exist).
- The Rust project is a single crate with two binaries (NOT a workspace with multiple crates).
- The Rust crate uses `#![forbid(unsafe_code)]` — no unsafe Rust anywhere.

## 7. React Component Conventions

Load the `react-code-conventions` skill (`.opencode/skills/react-code-conventions/`) when editing any TypeScript file in `ui/src/`. All UI components must use `export type` props, function declaration, and first-line destructure.
