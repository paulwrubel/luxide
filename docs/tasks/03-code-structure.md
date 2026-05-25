# Code Structure & Abstraction

**Goal**: Reduce duplicated code and create shared abstractions.

## Identified duplication

| Pattern                                                     | Location                                    | Lines duplicated |
| ----------------------------------------------------------- | ------------------------------------------- | ---------------- |
| `TrashIcon` SVG                                             | Geometric, Material, Texture controls cards | ~7 lines × 3     |
| `handleDelete{Type}`                                        | Same 3 cards                                | ~15 lines × 3    |
| Expand/collapse UI                                          | Same 3 cards                                | ~25 lines × 3    |
| `PlusIcon` SVG                                              | All 3 SpeedDials                            | ~7 lines × 3     |
| Card className (`!bg-zinc-800 !text-zinc-200 [&>div]:!p-0`) | All 5 card types                            | ~1 line × 5      |
| `NestedGeometricHeader` / `NestedTextureHeader`             | 26 lines each, 90% identical                | 26 lines × 2     |
| UI controls have no shared `BaseControlProps` interface     | 6 files in `ui/`                            | ~5 lines each    |

## Candidates for extraction
1. `DeleteButton.tsx` — shared delete button with TrashIcon
2. `NestedHeader.tsx` — generic nested header (replace both NestedGeometric and NestedTexture)
3. `shared-icons.tsx` — shared icon components (PlusIcon, TrashIcon)
4. `BaseControlProps` — shared form control interface
5. Pull the {Geometric,Material,Texture}ControlsCard into using the shared `ControlsCard` component instead of each hardcoding their own expand/collapse

## Where to start
Extract `TrashIcon`, `PlusIcon`, and the `NestedHeader` first (lowest risk, highest duplication reduction).
