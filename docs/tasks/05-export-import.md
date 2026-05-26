# Export/Import Render Config JSON

**Goal**: Allow users to export the render config as a JSON file and import one back.

## Current state
- `RenderConfig` type fully defined in `utils/render/config.ts`
- `normalizeRenderConfig()` converts `RawRenderConfig` → `NormalizedRenderConfig`
- `postRender()` endpoint sends `RenderConfig` JSON body
- No export endpoint, no download functionality, no file input for import
- No `FileReader` or `Blob` usage anywhere in the codebase

## Design
- **Export**: Add a "Download Config" button on the new-render page that serializes `form.state.values` to JSON and triggers a browser download via `URL.createObjectURL` + `<a download>`
- **Import**: Add a file input that reads JSON, validates with `RenderConfigSchema.safeParse()`, and populates the form via `form.reset(importedConfig)`
- **UI placement**: A small toolbar area above or below the sidebar

## Where to start
Implement export first (simpler — JSON → download). Then import (file input → validate → populate form).
