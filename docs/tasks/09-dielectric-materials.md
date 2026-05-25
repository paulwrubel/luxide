# Implement Dielectric Materials

**Goal**: Enable dielectric materials in the new-render form and 3D preview.

## Current state
- ✅ Fully typed, schematized, validated (`MaterialDielectricSchema`)
- ✅ Normalizer exists (`normalizeMaterialDielectric`)
- ✅ Default factory exists (`defaultMaterialForType('dielectric')`)
- ✅ Controls card has full UI: `index_of_refraction` slider (1.0-10.0) + texture selects
- ✅ `fixReferences` handles dielectric texture refs
- ❌ **Disabled in SpeedDial** (`MaterialType` excludes `'dielectric'`, button is `disabled`)
- ❌ **Not rendered in 3D preview** (`MaterialResolver` returns `null`)

## What needs to happen
1. Remove `'dielectric'` from the `Exclude<>` in `MaterialType`
2. Enable the Dielectric Material button in the SpeedDial
3. Implement dielectric rendering in R3F: `MeshPhysicalMaterial` with `transmission`, `ior`, `roughness` (requires Three.js r133+)

## Where to start
Enable the SpeedDial button (2-line change). Then tackle R3F rendering.
