---
name: react-component-conventions
description: Use when creating, editing, or refactoring React components and hooks in ui/src/. Enforces the repo's nine formatting rules: export type props, function declaration with props parameter, first-line destructure, blank line after, hook return destructuring, mandatory block braces, component size/folder structure, and one component per file.
---

# React Component Conventions

Every React component and hook in `ui/src/` must follow these nine rules.

## Rules

1. **Dedicated prop type** — named `ComponentNameProps` (e.g., `Foo` → `FooProps`)
2. **`export type`, not `interface`** — `export type FooProps = { ... }`
3. **Component signature** — `export function Foo(props: FooProps) {`
4. **Destructure first line** — `const { x, y } = props;` followed by a blank newline

5. **Destructure hook returns at the call site** — when calling `useQuery`, `useMutation`, `useState`, `useRef`, or any other hook, destructure the needed values at the call site. Do NOT assign the result to a variable and then access properties via dot notation. This applies to ALL hooks but is especially important for react-query hooks.

   ✅ Correct:
   ```tsx
   const { data, isPending, isError, error } = useQuery(...);
   const { mutate: doThing, isPending: thingPending } = useMutation(...);
   const [value, setValue] = useState(false);
   ```

   ❌ Anti-pattern:
   ```tsx
   const query = useQuery(...);
   // then: query.data, query.isPending, query.isError, etc.
   ```

6. **Mandatory curly braces on all block statements** — ALL `if`, `else if`, `else`, `for`, `while`, and `do...while` blocks MUST use curly braces `{ }`, even when the body is a single statement. No bare one-liners.

   ✅ Correct:
   ```tsx
   if (!container) {
     return;
   }
   ```

   ❌ Anti-pattern:
   ```tsx
   if (!container) return;
   if (!file) return;
   ```

7. **Component size and folder structure** — Components approaching or exceeding ~500 lines should be broken up into a folder named after the component (instead of a single file). The folder contains an `index.tsx` and any child components that are ONLY used by that component as separate files in the folder. This is the same naming pattern as a view directory.

   Structure example — when `MyComponent.tsx` grows too large, refactor to:
   ```
   MyComponent/
   ├── index.tsx         # main component (re-export pattern, re-imports children)
   ├── ChildA.tsx        # sub-component only used by MyComponent
   └── ChildB.tsx        # sub-component only used by MyComponent
   ```

   The `views/admin/`, `views/renders/[id]/RenderSidebar/`, and `views/renders/[id]/RenderDisplay/` directories demonstrate this pattern in the codebase.

8. **One component per file** — Each file must contain at most one React component (exported or unexported). If a parent component needs sub-components that are only used by it, those sub-components must live in their own separate files within a folder (see Rule 7). Non-component helper/utility functions and type definitions may co-exist in the same file as the component.

9. **Strict type safety** — the TypeScript type system must be relied on as much as possible. The following are forbidden:
   - Typing any variable, parameter, or return type as `any`
   - Suppressing the `no-explicit-any` lint rule with `// eslint-disable-next-line @typescript-eslint/no-explicit-any` or similar comments
   - `as` type assertions (casts) are strongly discouraged. If an `as` cast is truly unavoidable, it MUST be accompanied by a comment immediately above it explaining **why** the cast is necessary (e.g., "// the API response shape is known but the generated type is incomplete", or "// narrowing after a runtime guard that TS can't track"). Blind `as` casts with no justification are forbidden.

## Example

### Before (❌)

```tsx
interface FooProps {
  label: string;
  onClick: () => void;
}

export function Foo({ label, onClick }: FooProps) {
  const [open, setOpen] = useState(false);
  return <button onClick={onClick}>{label}</button>;
}
```

### After (✅)

```tsx
export type FooProps = {
  label: string;
  onClick: () => void;
};

export function Foo(props: FooProps) {
  const { label, onClick } = props;

  const [open, setOpen] = useState(false);

  return <button onClick={onClick}>{label}</button>;
}
```

## When creating a new component

Apply all nine rules from the start. If the component will likely exceed 500 lines, start it as a folder with `index.tsx` from the beginning.

## When editing an existing component

If the file already conforms, don't restructure it. If it doesn't, fix the violations while editing. When adding new hook calls, destructure the result — do NOT use dot-notation access on the returned object.

## Verification

The checklist is:
1. Props type is `export type ComponentNameProps = { ... }` (with semicolons, not commas)
2. Function signature uses `(props: ComponentNameProps)`, never inline destructure
3. First line is `const { ... } = props;`
4. A blank line follows the destructure line
5. All hook calls destructure their needed values at the call site (no `const x = useX(); x.data` patterns)
6. All `if`/`for`/`while` blocks use curly braces, even for single-line bodies
7. The component is under ~500 lines; if approaching that threshold, it is a folder with `index.tsx` and child component files
8. The file contains at most one React component (sub-components are separate files within a folder)
9. No `any` types or unjustified `as` casts anywhere in the file
10. Run `just validate` from the repo root to confirm the changes pass all checks (TypeScript, ESLint, Rust checks, clippy, tests)
