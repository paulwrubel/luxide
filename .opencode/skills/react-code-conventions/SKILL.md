---
name: react-code-conventions
description: Code conventions for all TypeScript files in ui/src/. Covers component-specific rules (props, destructure, hooks, file organization) and universal rules (mandatory braces, strict types).
---

# Code Conventions

All TypeScript code in `ui/src/` must follow these conventions. Rules 1-5, 7, and 8 apply only to React components and hooks. Rules 6 and 9 apply to every file.

## Rules

1. **Dedicated prop type** _(components only)_ — named `ComponentNameProps` (e.g., `Foo` → `FooProps`)
2. **`export type`, not `interface`** _(components only)_ — `export type FooProps = { ... }`
3. **Component signature** _(components only)_ — `export function Foo(props: FooProps) {`
4. **Destructure first line** _(components only)_ — `const { x, y } = props;` followed by a blank newline

5. **Destructure hook returns at the call site** _(components and hooks only)_ — when calling `useQuery`, `useMutation`, `useState`, `useRef`, or any other hook, destructure the needed values at the call site. Do NOT assign the result to a variable and then access properties via dot notation.

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

6. **Mandatory curly braces on all block statements** _(all files)_ — ALL `if`, `else if`, `else`, `for`, `while`, and `do...while` blocks MUST use curly braces `{ }`, even when the body is a single statement. No bare one-liners.

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

7. **Component size and folder structure** _(components only)_ — Components approaching or exceeding ~500 lines should be broken up into a folder named after the component (instead of a single file). The folder contains an `index.tsx` and any child components that are ONLY used by that component as separate files in the folder.

   Structure example — when `MyComponent.tsx` grows too large, refactor to:
   ```
   MyComponent/
   ├── index.tsx         # main component (re-export pattern, re-imports children)
   ├── ChildA.tsx        # sub-component only used by MyComponent
   └── ChildB.tsx        # sub-component only used by MyComponent
   ```

   The `views/admin/`, `views/renders/[id]/RenderSidebar/`, and `views/renders/[id]/RenderDisplay/` directories demonstrate this pattern in the codebase.

8. **One component per file** _(components only)_ — Each file must contain at most one React component (exported or unexported). If a parent component needs sub-components that are only used by it, those sub-components must live in their own separate files within a folder (see Rule 7). Non-component helper/utility functions and type definitions may co-exist in the same file as the component.

9. **Strict type safety** _(all files)_ — the TypeScript type system must be relied on as much as possible. The following are forbidden:
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

## When editing an existing file

If the file already conforms, don't restructure it. If it doesn't, fix the violations while editing. When adding new hook calls in a component, destructure the result — do NOT use dot-notation access on the returned object.

## Verification

The checklist is:
1. (components) Props type is `export type ComponentNameProps = { ... }` (with semicolons, not commas)
2. (components) Function signature uses `(props: ComponentNameProps)`, never inline destructure
3. (components) First line is `const { ... } = props;`
4. (components) A blank line follows the destructure line
5. (components) All hook calls destructure their needed values at the call site
6. (all files) All `if`/`for`/`while` blocks use curly braces, even for single-line bodies
7. (components) The component is under ~500 lines; if approaching that threshold, it is a folder with `index.tsx` and child component files
8. (components) The file contains at most one React component (sub-components are separate files within a folder)
9. (all files) No `any` types or unjustified `as` casts anywhere in the file
10. Run `just validate` from the repo root to confirm the changes pass all checks (TypeScript, ESLint, Rust checks, clippy, tests)
