# AGENTS.md / LLM Quickstart File

**Goal**: Create a file that LLMs can read to quickly understand the project structure.

## Current state
No `.agents`, `AGENTS.md`, `CLAUDE.md`, or similar file exists.

## What it should contain
- Project overview: Luxide — ray tracing render manager with Rust backend + React SPA frontend
- Tech stack: Vite + React + TypeScript + TanStack Form/Query + R3F + Tailwind v4 + flowbite-react 0.12 + framer-motion
- Directory structure with brief descriptions
- Key architectural decisions (TanStack Form over superforms, R3F over Threlte, why `ui/` is inside `views/render-new/`)
- Development commands (`just run`, `npm run dev`, `npm run build`)
- Known quirks:
  - flowbite-react uses separate compound exports (`DropdownItem`, `TabItem`, `SidebarItems`, not dot notation)
  - Dark mode needs both `@variant dark` in CSS + `initThemeMode()` in JS + `<ThemeProvider>` in React tree
  - `ToggleSwitch` label is string-only, render ReactNode icons as siblings
  - Button colors use `"default"` not `"primary"`, `"red"` not `"failure"`, `"yellow"` not `"warning"`
  - Card internal padding is `p-6` — override with `theme` prop or `[&>div]:!p-0`
  - TanStack Form values require `useStore(form.store, selector)` — not `form.state.values`

## Where to start
Create `AGENTS.md` in repo root.
