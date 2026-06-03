# Luxide — A path tracer written in Rust

Luxide renders images via Monte Carlo path tracing — simulating how light bounces through a scene to produce physically-based global illumination. It runs as a single-binary CLI for local rendering, or as a multi-tenant API server for managing renders at scale.

---

## Features

### Rendering

- **Full global illumination** via Monte Carlo path tracing with configurable sample count and bounce depth
- **Multi-threaded tile-based rendering** — the image is split into tiles that are processed in parallel using rayon, with configurable thread count
- **Progressive checkpoint iterations** — renders advance through discrete iterations, each adding more samples. You get partial results early, and can stop or extend the render at any checkpoint boundary
- **HDR color pipeline** — linear HDR colorspace throughout the tracer, with gamma correction applied on output. Optional scaling truncation prevents fireflies from extreme HDR values
- **Depth of field** (defocus blur) with configurable aperture angle and focus distance
- **Motion blur** on spheres via time-interpolated center positions

### Materials

- **Lambertian** (diffuse) — supports separate reflectance and emittance textures. Make emissive surfaces (light sources) by giving an emittance texture while keeping reflectance black
- **Specular** (metal/glossy) — Blinn-like roughness parameter from 0.0 (perfect mirror) to 1.0 (rough diffuse-like reflection)
- **Dielectric** (glass/water/diamond) — Snell's law refraction, Schlick reflectance approximation, configurable index of refraction, total internal reflection

### Textures

- **Solid color** — RGB values above 1.0 enable HDR light sources
- **Procedural checkerboard** — configurable scale, any two textures for the even/odd squares
- **Perlin noise** — configurable input and output mapping functions for marble, clouds, and other procedural patterns
- **8-bit image textures** — UV-mapped PNG/JPG with configurable gamma correction

### Geometric primitives

- **Spheres** — exact analytic intersection, UV mapping, optional motion blur
- **Parallelograms** — arbitrary quads with optional face culling
- **Triangles** — optional per-vertex normals for smooth shading, face culling
- **Axis-aligned boxes** — slab-method intersection
- **OBJ model loading** — triangulated meshes with configurable scaling, origin translation, normal recalculation, and optional internal BVH

### Scene composition

- **BVH** (Bounding Volume Hierarchy) — SAH-like construction, O(log n) intersection
- **Named resource references** — define materials, textures, geometrics, and cameras once, reference them by name anywhere
- **Transforms** — translate, rotate around X/Y/Z axes with configurable pivot points
- **Volumes** — constant-density fog/smoke via an isotropic phase function (Henyey-Greenstein style)
- **Built-in resource library** — preset Cornell Box components, materials, textures, and cameras with `__` prefix to avoid name collisions

### Config format

- **JSON** config files with a declarative, composable structure
- Resources defined in named dictionaries (`geometrics`, `materials`, `textures`, `cameras`, `scenes`)
- Supports both inline definitions and named references for all resource types
- `active_scene` selects which scene to render and can mix references with inline overrides

### CLI

- Single-binary local renderer: point it at a config file and get PNG output
- Progress tracking runs in the render manager (visible via API/checkpoints)
- Checkpoint images saved progressively throughout the render

### API server

- Multi-tenant HTTP server for creating, monitoring, and managing renders
- GitHub OAuth authentication with RS256 JWT tokens (24hr expiry)
- Per-user resource quotas for renders, checkpoints, and pixel count (admins have no limits)
- 15+ endpoints covering the full render lifecycle, checkpoint retrieval, render stats, and admin storage usage

---

## Quick start

```sh
# Build the CLI
cargo build --release --bin luxide-cli

# Render a scene (checkpoints appear as 1.png, 2.png, etc. in ./output/)
./target/release/luxide-cli configs/cornell_box.json -o ./output
```

---

## Scene configuration

Config files define a complete scene graph in JSON. Resources are declared in named dictionaries and wired together through references. Here's a minimal Cornell Box with a glass sphere:

```json
{
  "parameters": {
    "image_dimensions": [400, 400],
    "tile_dimensions": [64, 64],
    "gamma_correction": 2.0,
    "samples_per_checkpoint": 10,
    "total_checkpoints": 5,
    "max_bounces": 50,
    "use_scaling_truncation": true
  },
  "active_scene": {
    "name": "my_scene",
    "geometrics": [
      "cornell_box",
      {
        "type": "sphere",
        "center": [0.5, 0.2, -0.5],
        "radius": 0.2,
        "material": "dielectric_glass"
      }
    ],
    "use_bvh": true,
    "camera": {
      "vertical_field_of_view_degrees": 40,
      "eye_location": [0.5, 0.5, 1.44],
      "target_location": [0.5, 0.5, 0.0],
      "view_up": [0, 1, 0],
      "defocus_angle_degrees": 0,
      "focus_distance": "eye_to_target"
    },
    "background_color": [0, 0, 0]
  },
  "geometrics": {
    "cb_ceiling_light": {
      "type": "parallelogram",
      "lower_left": [0.35, 0.999, -0.65],
      "u": [0.3, 0, 0],
      "v": [0, 0, 0.3],
      "material": "lambertian_white_light"
    },
    "cornell_box": {
      "type": "list",
      "use_bvh": true,
      "geometrics": [
        { "type": "parallelogram", "lower_left": [0,0,0], "u": [0,0,-1], "v": [0,1,0], "material": { "type": "lambertian", "reflectance_texture": "solid_cb_green", "emittance_texture": "solid_black" } },
        { "type": "parallelogram", "lower_left": [1,0,-1], "u": [0,0,1], "v": [0,1,0], "material": { "type": "lambertian", "reflectance_texture": "solid_cb_red", "emittance_texture": "solid_black" } },
        { "type": "parallelogram", "lower_left": [0,0,0], "u": [1,0,0], "v": [0,0,-1], "material": "lambertian_cb_white" },
        { "type": "parallelogram", "lower_left": [0,1,-1], "u": [1,0,0], "v": [0,0,1], "material": "lambertian_cb_white" },
        { "type": "parallelogram", "lower_left": [0,0,-1], "u": [1,0,0], "v": [0,1,0], "material": "lambertian_cb_white" },
        "cb_ceiling_light"
      ]
    }
  },
  "materials": {
    "lambertian_white_light": {
      "type": "lambertian",
      "reflectance_texture": "solid_black",
      "emittance_texture": { "type": "color", "color": [10, 10, 10] }
    },
    "lambertian_cb_white": {
      "type": "lambertian",
      "reflectance_texture": { "type": "color", "color": [0.73, 0.73, 0.73] },
      "emittance_texture": "solid_black"
    },
    "dielectric_glass": {
      "type": "dielectric",
      "reflectance_texture": "solid_white",
      "emittance_texture": "solid_black",
      "index_of_refraction": 1.5
    }
  },
  "textures": {
    "solid_white":     { "type": "color", "color": [1, 1, 1] },
    "solid_black":     { "type": "color", "color": [0, 0, 0] },
    "solid_cb_green":  { "type": "color", "color": [0.12, 0.45, 0.15] },
    "solid_cb_red":    { "type": "color", "color": [0.65, 0.05, 0.05] }
  }
}
```

The pattern is always the same: define your resources by name, then reference them. Inline definitions work anywhere a reference is accepted, keeping small experiments concise.

---

## CLI usage

```sh
luxide-cli <config_file> [-o|--output_dir <OUTPUT_DIR>]

Arguments:
  <config_file>     Path to a JSON render configuration file
  -o, --output_dir  Output directory for checkpoint images (default: ./output)
```

Each checkpoint iteration writes a PNG file named `<iteration>.png` (e.g., `1.png`, `2.png`) into a subdirectory under the output directory.

### Render parameters reference

| Parameter | Description |
|---|---|
| `image_dimensions` | Output image width and height in pixels |
| `tile_dimensions` | Tile size in pixels for parallel rendering |
| `gamma_correction` | Gamma value for encoding output (2.0 is typical) |
| `samples_per_checkpoint` | Samples accumulated per pixel in each checkpoint iteration |
| `total_checkpoints` | How many checkpoint iterations to run |
| `max_bounces` | Maximum ray bounce depth before terminating |
| `use_scaling_truncation` | Clamp HDR values to [0,1] before gamma correction (prevents fireflies) |
| `saved_checkpoint_limit` | Maximum number of checkpoints to keep pixel data for (older ones are cleared) |

---

## Building from source

```sh
# Prerequisites: Rust (edition 2024), Cargo

# CLI only (no external dependencies)
cargo build --release --bin luxide-cli

# Full API server (requires PostgreSQL)
cargo build --release --bin luxide-api

# API server without the embedded frontend
cargo build --release --bin luxide-api --no-default-features
```

---

## Example configs

All example configs live in the `configs/` directory:

- `cornell_box.json` — Classic Cornell Box with glass boxes, image textures, mirror, and perlin noise spheres
- `cornell_box_teapot.json` — Cornell Box with dielectric and specular OBJ teapots
- `cornell_box_inline.json` — Cornell Box with everything defined inline (no named references)
- `cornell_triangle_test.json` — Triangle mesh and OBJ loading example
- `template.json` — Pedagogical template showing every config feature with annotations

---

## License

MIT
