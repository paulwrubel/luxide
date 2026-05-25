# SpeedDial / Element Addition

**Goal**: Provide a way to add new geometrics, materials, and textures to the render config.

## Current state
- Uses `Dropdown` + `DropdownItem` from flowbite-react (no real SpeedDial component in flowbite-react 0.12)
- `NewGeometricSpeedDial.tsx` (87 lines) — 10 types listed, `obj_model` excluded from type
- `NewMaterialSpeedDial.tsx` (67 lines) — 3 types, dielectric disabled
- `NewTextureSpeedDial.tsx` (67 lines) — 3 types, checker and image disabled
- All three use identical `PlusIcon` inline SVG (verbatim duplication)
- All three follow identical `handleNew{Type}` pattern: default factory → unique name → form.setFieldValue
- Geometric dial also updates `scenes[active_scene].geometrics` array

## Known issues
- `defaultGeometricForType` has overloads — `obj_model` requires `filename` parameter
- `defaultTextureForType` has overloads — `image` requires `filename` parameter
- Material and Texture `setFieldValue` calls previously needed `as any` casts (now resolved)

## Where to start
Extract shared `PlusIcon` and `handleAddEntity` pattern into a reusable hook or component. Consider whether dropdowns are the right UX or if a modal/popover would be better.
