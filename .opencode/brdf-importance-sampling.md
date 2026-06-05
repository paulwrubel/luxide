# BRDF / Importance Sampling Plan

## What We Built (Current State)

**This is a fresh start.** The previous `feat/brdfs-and-pdfs` branch was discarded. All code from that effort (ScatterRecord, ONB, `random_cosine_direction`, `scattering_pdf`, `skip_pdf`, explicit PDF division in `ray_color`) is gone.

We are working on branch `feat/brdfs-and-pdfs-2`, based off `main`, with the original Peter Shirley Book 1/2 code as the baseline:

- `Material::scatter(&self, ray, ray_hit) -> Option<Ray>` — returns a scattered ray directly, no PDF attached
- `Camera::ray_color()` — recursive/loop integrator with emittance + reflectance accumulation, no explicit PDF denominator
- Lambertian scatter: `normal + random_unit_vector()` (cosine-weighted via normalization of random hemisphere direction, but *not* expressed as a PDF)
- Isotropic scatter: `random_unit_vector()` (uniform sphere direction)
- `Geometric` trait only has `intersect` / `bounding_box` — no sampling methods

---

## Key Concepts

### BRDF (Bidirectional Reflectance Distribution Function)

The BRDF describes how light reflects off a surface. Given incoming and outgoing directions, it returns the ratio of reflected radiance to incoming irradiance.

**Lambertian BRDF** = `albedo / π` (constant, energy-conserving).

In code: currently `ray_color` multiplies the reflectance color into `attentuation_strength`. When we introduce `brdf()`, the material will return this value directly.

### Importance Sampling

Instead of shooting rays uniformly and hoping they hit lights, we sample directions *proportional to how much they contribute* to the final color. This dramatically reduces noise.

**Key formula:** Monte Carlo estimator with importance sampling

```
L ≈ (brdf * emission * cos_theta) / pdf
```

When `pdf ≈ brdf * cos_theta` (i.e., the PDF matches the integrand shape), variance drops sharply.

### ONB (Orthonormal Basis)

A local coordinate frame `(u, v, w)` built from the surface normal. Used to sample directions relative to the surface (e.g., cosine-weighted hemisphere sampling).

The ONB class converts between local coordinates (where `w` is the "up" axis aligned with the normal) and world coordinates.

### Mixture PDF

When a scene has multiple lights (especially small lights), no single PDF works well everywhere. A `MixturePdf` combines several PDFs (e.g., cosine hemisphere + light sampling) so rays are likely to hit both diffuse surfaces *and* lights.

---

## Books Referenced

**Peter Shirley, Ray Tracing in One Weekend Series (Books 1–3)**

- **Book 1** — Basic ray tracing: camera, spheres, Lambertian/Metal/Dielectric materials, antialiasing, defocus blur.
- **Book 2** — BVH, textures, perlin noise, quads, volumes (constant density), scene description.
- **Book 3** — BRDF models, PDF-based sampling, cosine hemisphere sampling, mixture PDFs, light sampling via `GeometricPdf`, explicit PDF denominator in the integrator.

Our baseline (currently on `main`) covers Books 1 and 2 fully. The `feat/brdfs-and-pdfs-2` branch will implement Book 3 step by step.

---

## What Remains (Future Work)

All steps below are derived from Peter Shirley's *Ray Tracing: The Rest of Your Life* (Book 3).

### Step 0 — `brdf()`, ONB, ScatterRecord, `random_cosine_direction()`, migrate integrator

Introduce the core building blocks without yet changing *what* is sampled:

- Add `ONB` struct with `build_from_w(normal)` and `local(u, v, w) -> Vector` methods
- Add `Vector::random_cosine_direction()` that returns a cosine-weighted random direction on the hemisphere (z-up in local space, then transformed via ONB)
- Add `ScatterRecord` struct holding the scattered ray, attenuation color, and (later) a PDF pointer
- Add `brdf()` method to the `Material` trait — Lambertian returns `albedo / π`, others return zero (or their proper BRDF if specular/dielectric)
- Refactor `Material::scatter()` to return `ScatterRecord` instead of `Option<Ray>`
- Refactor `Camera::ray_color()` to use the explicit Monte Carlo formula:

```
L = emitted + brdf * cos_theta * ray_color(scattered) / pdf
```

Initially `pdf` is hardcoded to the cosine-hemisphere PDF value (`cos_theta / π`), so the numerator and denominator cancel exactly and the image looks identical to before. This is the "trust nothing, verify everything" checkpoint.

**Files affected:** `src/camera.rs`, `src/shading/materials.rs`, `src/shading/materials/lambertian.rs`, `src/shading/materials/isotropic.rs`, `src/shading/materials/specular.rs`, `src/shading/materials/dielectric.rs`, new file for `ONB` and `ScatterRecord` (likely `src/shading/onb.rs` or similar).

### Step 1 — `Pdf` trait + `CosineHemispherePdf` + `UniformSpherePdf`

Extract PDF calculation into its own abstraction:

- Define a `Pdf` trait: `fn sample(&self) -> Vector` and `fn density(&self, dir: Vector) -> f64`
- `CosineHemispherePdf` — samples a cosine-weighted hemisphere via `random_cosine_direction()`, density = `cos_theta / π`
- `UniformSpherePdf` — samples uniformly on the unit sphere, density = `1 / (4π)`
- Refactor Lambertian to use `CosineHemispherePdf` internally
- Refactor Isotropic to use `UniformSpherePdf` internally

At this point the image should still be identical to baseline (Step 0).

### Step 2 — Geometric sampling primitives

Add direction sampling to the `Geometric` trait so geometry can serve as a light-sampling target:

- `fn sample_direction_from(&self, origin: Point) -> Vector`
- `fn direction_pdf(&self, origin: Point, dir: Vector) -> f64`
- Implement for sphere, parallelogram, BVH, constant-volume wrapper, transform wrappers
- Compute the Jacobian from area PDF to solid-angle PDF: `pdf_direction = pdf_area * distance² / |cos_alpha|`

This is purely additive — nothing consumes these yet.

### Step 3 — `GeometricPdf` + `MixturePdf` + separate lights list

The actual importance sampling step where the PDF ratio stops being 1.0:

- `GeometricPdf` wraps a `&dyn Geometric` (a light) and implements `Pdf` via `sample_direction_from` / `direction_pdf`
- `MixturePdf` holds two `Arc<dyn Pdf>` and randomly delegates to one, averaging their densities
- Add a `lights` list to the scene (separate from `world`) — a list of geometric objects that emit light
- In `ray_color`, build a `MixturePdf` from the surface's own PDF (cosine hemisphere) and a `GeometricPdf` over the lights
- Pass this mixture PDF into `ScatterRecord` so the integrator uses it

The PDF ratio is no longer 1.0, so the image will change (less noise around light sources).

### Step 4 — Validate on small-light scene

Test with the classic Book 3 scene: a large diffuse box with a tiny emissive sphere/quad. Without importance sampling, this scene is extremely noisy. With `GeometricPdf` + `MixturePdf`, it should converge cleanly.

---

## Naming Conventions

The user has specified exact naming. Deviations must be caught in review:

| Concept | Name | Notes |
|---|---|---|
| PDF trait | `Pdf` | methods: `sample(&self) -> Vector`, `density(&self, dir: Vector) -> f64` |
| Cosine hemisphere PDF | `CosineHemispherePdf` | not `CosinePdf` |
| Uniform sphere PDF | `UniformSpherePdf` | not `SpherePdf` |
| Geometry-targeting PDF | `GeometricPdf` | not `HittablePdf` |
| Mixture PDF | `MixturePdf` | |
| Geometric sampling methods | `sample_direction_from(&self, origin: Point) -> Vector` | on the `Geometric` trait |
| | `direction_pdf(&self, origin: Point, dir: Vector) -> f64` | on the `Geometric` trait |

**Direction vs Point vs Ray conventions:**
- Direction parameter is always a unit `Vector`
- Origin parameter is always a `Point`
- `Ray` is used only for actual ray tracing (intersection queries)

---

## Session Notes

- **Current branch:** `feat/brdfs-and-pdfs-2`
- **Baseline:** original Book 1/2 code from `main`. The previous `feat/brdfs-and-pdfs` branch was discarded entirely.
- **Naming conventions** (see table above) are the user's explicit preferences and should be checked on every code review.
- **Goal:** Implement Book 3 (*The Rest of Your Life*) step by step, with careful verification at each checkpoint to ensure the image doesn't regress.
- **Key binding:** `ray_color` changes must produce identical output in Steps 0–1 (cosine PDF cancellation). Changes in Step 3 will change the image (that's the point).
