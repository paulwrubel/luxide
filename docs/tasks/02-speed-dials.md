# SpeedDial / Element Addition

**Goal**: Provide a way to add new geometrics, materials, and textures to the render config.

## Current state
- Uses `Dropdown` + `DropdownItem` from flowbite-react (no real SpeedDial component in flowbite-react 0.12)
- `NewGeometricSpeedDial.tsx` (10 types listed, `obj_model` excluded from type)
- `NewMaterialSpeedDial.tsx` (3 types, dielectric disabled)
- `NewTextureSpeedDial.tsx` (3 types, checker and image disabled)
- All three follow identical `handleNew{Type}` pattern: default factory → unique name → form.setFieldValue
- Geometric dial also updates `scenes[active_scene].geometrics` array

## Known issues
- `defaultGeometricForType` has overloads — `obj_model` requires `filename` parameter
- `defaultTextureForType` has overloads — `image` requires `filename` parameter
- All three files share a near-identical structure — candidate for a single generic component

## Where to start
Extract shared `handleAddEntity` pattern into a reusable hook or component. Consider whether dropdowns are the right UX or if a modal/popover would be better.
