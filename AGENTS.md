## 1. Project Overview

Luxide is a **ray tracing render manager** — a multi-tenant platform where users can create, monitor, and manage path-traced renders. It consists of:
- A **Rust backend** (HTTP API server + CLI renderer) with a custom path tracing engine
- A **React SPA frontend** for creating render configurations and monitoring progress

The project was recently migrated from Svelte to React. The `ui/` directory is the active React frontend. `ui-svelte/` is deprecated and kept only for reference.

---

## 2. Tech Stack

### Backend (Rust)
- **Web framework**: Axum 0.8 with tower-http (CORS)
- **Database**: SQLx 0.8 with PostgreSQL (also supports FileStorage and InMemoryStorage backends)
- **Auth**: GitHub OAuth2 → JWT (RS256, 24hr expiry)
- **Rendering**: Custom path tracing engine in `src/tracing/` (rayon-parallel, tile-based)
- **CLI**: clap 4.5 for the `luxide-cli` binary
- **Key deps**: tokio, serde/serde_json, uuid, chrono, reqwest, image, dashmap

### Frontend (React + TypeScript)
- **Build**: Vite 8 + TypeScript ~6.0
- **Routing**: react-router-dom v7
- **State/Data**: @tanstack/react-query ^5.100 (server state, 1s polling), @tanstack/react-form ^1.32 + @tanstack/zod-form-adapter (form state)
- **3D Preview**: @react-three/fiber ^9.6 + @react-three/drei ^10.7 + three ^0.184
- **UI Kit**: flowbite-react ^0.12
- **Animation**: framer-motion ^12.40
- **Validation**: zod ^3.25
- **CSS**: Tailwind CSS v4 (configured entirely in CSS, no config file; dark mode via `.dark` class)
- **Icons**: react-icons ^5.6

---

## 3. Directory Structure

- `src/` — Rust backend: HTTP API server, CLI renderer, path tracing engine, geometry/shading libraries
  - `src/bin/api.rs` — luxide-api binary entry point
  - `src/bin/cli.rs` — luxide-cli binary entry point
  - `src/server/` — Axum HTTP server: router, handlers (14+ endpoints), auth manager, state
  - `src/tracing/` — Core render engine: tracer (rayon-parallel), render manager (state machine), storage backends (Postgres, File, InMemory)
  - `src/deserialization/` — JSON/YAML render config deserialization and compilation (scenes, cameras, geometrics, materials, textures)
  - `src/geometry/` — Geometric primitives (sphere, triangle, parallelogram), transforms, BVH, OBJ loader, volumes
  - `src/shading/` — Materials (lambertian, specular, dielectric, isotropic) and textures (solid color, checker, image, noise)
  - `src/utils/` — Utilities: binary encoding, progress tracking, intervals, time formatting
- `ui/` — React SPA frontend (active)
  - `ui/src/views/` — Page-level components organized by route (Layout, home, login, renders, render-detail, render-new)
  - `ui/src/hooks/` — React Query hooks (useRenders, useRender, useLatestCheckpointImage) + TanStack Form hook (useRenderForm)
  - `ui/src/utils/` — API client (api.ts), Zod schemas for render config domain model, THREE.js helpers
  - `ui/src/providers/` — AuthProvider (React Context + localStorage token management)
- `ui-svelte/` — ⚠️ DEPRECATED Svelte frontend (kept for reference only, not in use)
- `migrations/` — SQLx PostgreSQL migrations (7 migration pairs)
- `models/` — 3D model files (teapot.obj, teapot_normals.obj)
- `configs/` — Example render configurations (JSON + YAML, Cornell box variants)
- `benches/` — Criterion benchmarks (AABB, parallelogram, sphere)
- `bruno/` — Bruno API client collections for testing endpoints
- `texture_images/` — Texture images for rendering

---

## 4. Key Architectural Decisions

- **TanStack Form over alternatives**: Chosen for headless, type-safe form management with Zod schema integration. All render configuration forms use TanStack Form with the Zod adapter.
- **R3F (React Three Fiber) over Threlte**: Since the project migrated to React, R3F is the natural React renderer for Three.js. The 3D scene preview is built with R3F + drei helpers.
- **3D scene preview embedded in `views/render-new/`**: The 3D preview canvas is tightly coupled to the "new render" creation page rather than being a standalone reusable component. This is because the preview is only needed during scene creation — once a render is submitted, the backend handles the actual path tracing and the UI displays checkpoint images.
- **Trait-based storage backends**: The `RenderStorage` and `UserStorage` traits allow swapping between PostgreSQL, filesystem, and in-memory storage via config. Both the API server and CLI use the same storage abstraction.
- **GitHub OAuth → JWT auth flow**: Users authenticate via GitHub OAuth2. On callback, the server creates/finds the user, issues a RS256-signed JWT (24hr). Subsequent requests use `Authorization: Bearer <token>`. Admin users (defined in secrets) get unlimited resource quotas.
- **Poll-based render manager**: The `RenderManager` polls every 1 second for state transitions (Created→Running→FinishedCheckpointIteration). The frontend mirrors this with 1s polling via React Query.
- **Resource limits per user**: Regular users have defaults (1 render, 1 checkpoint/render, 250K max pixel count). Admins have no limits.

---

## 5. Development Commands

| Command                         | Description                                                      |
| ------------------------------- | ---------------------------------------------------------------- |
| `just run`                      | Build and run via Docker Compose (API + PostgreSQL)              |
| `just run-local`                | Build API + run PostgreSQL, then start API server locally        |
| `just run-ui`                   | Start Docker services + Vite dev server on port 5173             |
| `just run-postgres`             | Start PostgreSQL container + run migrations                      |
| `just build`                    | Build UI + run migrations + build both Rust binaries (release)   |
| `just build-api`                | Build UI + run migrations + build luxide-api (release)           |
| `just build-cli`                | Build luxide-cli (release)                                       |
| `just build-ui`                 | Setup Node env + build React UI                                  |
| `just clean`                    | Cargo clean + remove ui/dist + stop Docker                       |
| `just generate-jwt-keypair-pem` | Generate RSA keypair for JWT signing                             |
| `cd ui && npm run dev`          | Start Vite dev server (port 5173, proxies /api → localhost:8080) |
| `cd ui && npm run build`        | TypeScript check + Vite production build (outputs to ../ui/dist) |
| `cd ui && npm run lint`         | Run ESLint                                                       |
| `cargo build --release`         | Build both Rust binaries                                         |

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
- **Values require `useStore`**: Use `useStore(form.store, selector)` to read form values reactively — NOT `form.state.values`. Example: `const values = useStore(form.store, (state) => state.values);`

### Tailwind CSS v4
- No `tailwind.config.ts` file exists. All configuration is done via CSS `@theme` block in `ui/src/index.css`.
- Flowbite classes are sourced via `@source '../node_modules/flowbite-react';` in the CSS file.

### Backend
- `luxide.json` and `luxide.secret.json` in the repo root are the API config and secrets files (not checked into git; templates should exist).
- The Rust project is a single crate with two binaries (NOT a workspace with multiple crates).

---

## Additional Notes

- The Rust crate uses `#![forbid(unsafe_code)]` — no unsafe Rust anywhere.
- Rust edition: 2024
- Database: PostgreSQL with JSONB columns for render state and config, BYTEA for bincode-encoded pixel data.
- The backend embeds the built UI at compile time via `include_dir!`, so `just build-api` builds the UI first.
- The API server's Vite dev proxy forwards `/api` to `localhost:8080` for development; in production the API serves the UI directly.
