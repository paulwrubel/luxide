# Delete Element Functionality

**Goal**: Allow deletion of geometrics, materials, and textures. Implemented but buggy.

## Current state
- Render deletion works via API
- Geometric/Material/Texture deletion implemented in controls cards via `handleDelete{Type}` functions
- All three follow identical pattern: clone → delete key → `fixReferences()` → `form.setFieldValue()` for all 4 config sections
- `fixReferences()` in `utils/render/utils.ts` (88 lines) handles dangling references
- **No confirmation dialog** before deletion
- **No undo** mechanism
- Geometric delete writes to all 4 form sections — excessive re-renders

## Known bugs
- Deleting the last geometric in a scene may leave an empty scene with broken preview
- Deleting a material referenced by multiple geometrics should work (fixReferences) but untested
- Editor expand state resets when controls re-render from form updates

## Where to start
Add confirmation dialog. Then optimize the 4× `setFieldValue` pattern (could batch or use `form.reset()` with the full new config).
