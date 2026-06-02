---
name: react-component-conventions
description: Use when creating, editing, or refactoring React components in ui/src/. Enforces the repo's four component formatting rules: export type props, function declaration with props parameter, first-line destructure, and blank line after.
---

# React Component Conventions

Every React component in `ui/src/` must follow these four rules.

## Rules

1. **Dedicated prop type** — named `ComponentNameProps` (e.g., `Foo` → `FooProps`)
2. **`export type`, not `interface`** — `export type FooProps = { ... }`
3. **Component signature** — `export function Foo(props: FooProps) {`
4. **Destructure first line** — `const { x, y } = props;` followed by a blank newline

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

Apply all four rules from the start.

## When editing an existing component

If the file already conforms, don't restructure it. If it doesn't, fix the violations while editing.

## Verification

After writing, check:
1. Props type is `export type ComponentNameProps = { ... }` (with semicolons, not commas)
2. Function signature uses `(props: ComponentNameProps)`, never inline destructure
3. First line is `const { ... } = props;`
4. A blank line follows the destructure line
5. Run `just validate` from the repo root to confirm the changes pass all checks (TypeScript, ESLint, Rust checks, clippy, tests)
