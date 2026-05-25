# Code Quality Review

**Goal**: Review all React-ported code for quality, style consistency, and documentation.

## Current state
- 40+ `.tsx` files, none with JSDoc comments
- Sparse inline comments (only ~5 meaningful comments across all files)
- `geometric.ts` is 819 lines — monolithic, all types/schemas/normalizers/defaults in one file
- `api.ts` is 328 lines — all endpoints in one file, no separation by domain

## Personal style patterns observed
- PascalCase default-export components with `{Name}Props` interfaces
- 2-space indentation, no trailing commas
- Every controls card duplicates the same expand/collapse + delete pattern (~80 lines each)
- Heavy `!important` Tailwind overrides (`!bg-zinc-800`)
- Inconsistent `!` prefixing between GeometricControlsCard and Material/TextureControlsCard

## Where to start
`views/render-new/GeometricControlsCard.tsx` (212 lines — the largest component, candidate for extraction)
