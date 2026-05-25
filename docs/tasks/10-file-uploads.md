# File Uploads for .obj Models and Textures

**Goal**: Allow users to upload `.obj` files for 3D models and image files for textures.

**THIS IS A MASSIVE CROSS-CUTTING TASK.** Touches API, UI, 3D rendering, file handling, and Rust backend.

## Current state
- Data model supports it: `TextureImage` has `filename: string`, `GeometricObjModel` has `filename: string`
- ✅ Types and schemas exist for both
- ❌ **No file input component** anywhere in the codebase
- ❌ **No file upload API endpoint** in `utils/api.ts`
- ❌ **No `FormData` or multipart handling**
- ❌ Texture image shows "TODO" placeholder in UI
- ❌ OBJ model disabled in SpeedDial
- ❌ Both excluded from their type aliases

## Scope
1. **API layer**: Add file upload endpoint to Rust backend, then client function to `api.ts`
2. **UI layer**: Add file input component for the new-render form
3. **Texture**: Enable Image Texture in SpeedDial, implement image texture controls card
4. **OBJ**: Enable .obj Model in SpeedDial, implement OBJ model controls card
5. **3D preview**: Load and render uploaded OBJ files in R3F (using `useLoader` with `OBJLoader`)

## Where to start
Begin with the Rust API endpoint for file uploads. Then the client-side function. Then the UI pieces.
