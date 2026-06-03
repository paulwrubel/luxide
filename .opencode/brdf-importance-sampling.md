# BRDF & Importance Sampling — Context for AI Sessions

## Quick Context Recovery

When starting a new session about BRDF/PDF/importance sampling work, read these files in order:

1. **This document** — `.opencode/brdf-importance-sampling.md`
2. **The new types** — `src/shading/materials.rs` (ScatterRecord, Material trait), `src/geometry/onb.rs` (Onb), `src/geometry/vector.rs` (random_cosine_direction near lines 123-133)
3. **The path tracing loop** — `src/camera.rs` lines 130-184 (ray_color, note the explicit PDF division on line 164)
4. **Each material implementation** — `src/shading/materials/lambertian.rs`, `specular.rs`, `dielectric.rs`, `isotropic.rs`
5. **The Peter Shirley books** — `reference/v4.0.0-alpha.1/` — three HTML files. Key chapters for importance sampling are in "Ray Tracing The Rest of Your Life.html"

## Key Concepts (for explaining to the user)

The user (paulwrubel) is the sole developer. He has a math minor and hobbyist interest in rendering but no formal graphics training. He needs concepts explained in plain language before code.

### BRDF (Bidirectional Reflectance Distribution Function)
- A function f(ω_i, ω_o) that describes how light reflects off a surface
- "If light arrives from direction ω_i, what fraction bounces toward ω_o?"
- Every surface is defined by its BRDF. Lambertian = constant (albedo/π). Mirror = delta function (zero everywhere except one direction). Glossy = concentrated lobe around mirror direction.
- The current code has implicit BRDFs (each material's scatter method), not explicit ones. The refactoring moves toward explicit BRDF computation.

### PDF (Probability Density Function)
- In Monte Carlo integration: estimate = sum of f(sample) / p(sample), where p is the probability of choosing that sample
- The scattering PDF (pScatter) = the BRDF shape — how light physically distributes
- The sampling PDF (p) = the probability distribution used to pick random directions
- When p == pScatter (perfect match), the ratio cancels and the math simplifies
- The current Lambertian code achieves this cancellation: both scatter and sample use cosine-weighted hemisphere

### Importance Sampling
- Choosing samples from a distribution that matches the integrand to reduce noise
- The closer p is to f, the faster convergence
- For a path tracer: sample directions where the BRDF is large (surface sampling) OR where incoming light is bright (light sampling / NEE)
- Mixture PDFs blend both strategies

### NEE (Next Event Estimation) / Light Sampling
- Instead of hoping random bounces hit a light, explicitly connect to light sources at each bounce
- Shoot a shadow ray toward a random point on the light, check visibility, add contribution
- This is the single biggest convergence improvement for scenes with small lights
- NOT yet implemented in Luxide — it's the next step after the current architecture

### Shadow Rays vs Mixture Densities
- The Peter Shirley book (Rest of Your Life, Chapter 11) discusses two approaches:
  - **Shadow rays**: at each hit, send terminal rays to random lights. Cheaper per ray, doesn't bounce. Common in professional path tracers.
  - **Mixture densities**: blend surface PDF + light PDF into a single sampling distribution. Can sample windows, bright cracks, not just lights. The book's preferred approach.
- The current architecture is set up for mixture densities (the `pdf` field and `skip_pdf` flag in ScatterRecord support it)

### Direction Convention (ω_i vs ω_o)
- These are named for PHYSICAL light flow, not ray tracing direction
- In a backward path tracer (which Luxide is), rays travel OPPOSITE to physical light
- ω_o (outgoing) = where light physically departs toward = direction back toward camera = where the current ray CAME FROM
- ω_i (incident) = where light physically arrives from = direction toward lights/sources = where the NEXT ray will be shot

### The Elegant Lambertian Cancellation
- Lambertian BRDF: pScatter = cos(θ)/π
- Cosine-weighted sampling PDF: p = cos(θ)/π
- Monte Carlo estimator: f/p = (albedo × cos(θ)/π × incoming) / (cos(θ)/π) = albedo × incoming
- This is why the current code works without explicit PDF division — the terms cancel
- This cancellation is WHY the old code (Peter Shirley books 1-2) appears simpler: it's not missing PDFs, it's exploiting a perfect match
- Important: this means the old code was NOT over-brightening and NOT biased for Lambertian surfaces. It was mathematically correct.

## The Three Peter Shirley Books (reference/v4.0.0-alpha.1/)

All three books are HTML files. Math is rendered via MathJax (inline). Code listings are in C++.

### Book 1: Ray Tracing in One Weekend
- File: `Ray Tracing in One Weekend.html`
- Covers: basic ray tracing, diffuse (Lambertian), metal (specular), glass (dielectric), camera, defocus blur
- The `random_unit_vector()` rejection method is introduced here

### Book 2: Ray Tracing The Next Week
- File: `Ray Tracing The Next Week.html`
- Covers: BVH, textures, Perlin noise, quads, lights (emissive materials), volumes, instances

### Book 3: Ray Tracing The Rest of Your Life (THE KEY BOOK)
- File: `Ray Tracing The Rest of Your Life.html`
- Covers: Monte Carlo integration, PDFs, importance sampling, light sampling, mixture densities
- **Chapter 1-3**: Monte Carlo basics, PDF fundamentals, CDF inversion
- **Chapter 4**: Monte Carlo on the sphere of directions
- **Chapter 5**: Light scattering, the scattering PDF (where explicit PDF terms enter)
- **Chapter 6**: Playing with importance sampling (matching vs. unmatching PDFs)
- **Chapter 7**: Generating random directions (inversion method, cosine directions)
- **Chapter 8**: Orthonormal bases (ONB)
- **Chapter 9**: Sampling lights directly
- **Chapter 10**: Mixture densities (cosine_pdf, hittable_pdf, mixture_pdf classes)
- **Chapter 11**: Architectural decisions (mixture vs shadow rays, specular handling)
- **Chapter 12**: Cleaning up PDF management (ScatterRecord, skip_pdf for specular)
- **Chapter 13+**: Importance sampling textures, environment maps, spatial densities

## What We Built (Current State)

### Architecture Summary
We implemented the architecture from Book 3 up through Chapter 12, but WITHOUT the mixture-pdf / light-sampling step. The rendered output is identical to before — this is purely an architectural refactoring that makes future importance-sampling work possible.

### New Types
- **`ScatterRecord`** (`src/shading/materials.rs`): bundles attenuation, scattered ray, PDF value, and skip_pdf flag. Replaces separate `scatter() -> Option<Ray>` and `reflectance()` calls.
- **`Onb`** (`src/geometry/onb.rs`): orthonormal basis {u, v, w} for orienting Z-axis-relative direction vectors to surface normals. Methods: `build_from_w(normal)`, `local(x,y,z)`, `local_from_vec(v)`.
- **`Vector::random_cosine_direction()`** (`src/geometry/vector.rs` line 123): generates cosine-weighted directions on hemisphere using inversion method (CDF inversion).

### Material Trait Changes
- New method: `scattering_pdf(ray_in, ray_hit, scattered) -> f64` — returns the BRDF value for a given direction pair. Default 0.0 (for delta-function materials).
- Changed method: `scatter(ray, ray_hit) -> Option<ScatterRecord>` — was `scatter(ray, ray_hit) -> Option<Ray>`. Now bundles attenuation and PDF into the return value.
- `reflectance()` and `emittance()` remain on the trait (emittance still used, reflectance may be dead code in ray_color but kept for other consumers).

### Per-Material Implementation

| Material | scattering_pdf | scatter sampling | skip_pdf |
|---|---|---|---|
| Lambertian | cos(θ)/π (capped at 0) | ONB-based cosine-weighted | false |
| Specular | 0.0 (delta function) | Mirror reflection + roughness jitter | true |
| Dielectric | 0.0 (delta function) | Fresnel-weighted reflect/refract | true |
| Isotropic | 1/(4π) (uniform sphere) | Uniform sphere (random_unit) | false |

### ray_color() Loop
The path tracing loop now uses explicit PDF division:
```rust
let Some(srec) = ray_hit.material.scatter(ray, &ray_hit) else {
    return accumulated_color;
};
ray = srec.scattered;
if srec.skip_pdf {
    // specular/dielectric: skip PDF division
    attentuation_strength *= srec.attenuation;
} else {
    // diffuse: explicit PDF ratio (pdf = scattering_pdf for now, ratio = 1.0)
    let pdf = srec.pdf;
    attentuation_strength *= srec.attenuation * srec.pdf / pdf;
}
```

The `srec.pdf / pdf` ratio is 1.0 for now (since both use the material's own sampling PDF), so the output is identical. This structure is a placeholder for when mixture PDFs introduce a different `pdf` value.

### Files Changed (all on branch, commit 98efe34)
- `src/geometry/vector.rs` — added `random_cosine_direction()`
- `src/geometry/onb.rs` — new file, ONB struct
- `src/geometry.rs` — added `mod onb` + re-export
- `src/shading/materials.rs` — ScatterRecord struct, trait changes
- `src/shading/materials/lambertian.rs` — scattering_pdf + ONB scatter + ScatterRecord
- `src/shading/materials/specular.rs` — scattering_pdf + ScatterRecord
- `src/shading/materials/dielectric.rs` — scattering_pdf + ScatterRecord
- `src/shading/materials/isotropic.rs` — scattering_pdf + ScatterRecord
- `src/camera.rs` — ray_color uses explicit PDF + ScatterRecord

## What Remains (Future Work)

### Immediate next steps (in order)
1. **PDF class hierarchy**: Create a `Pdf` trait with `value(direction)` and `generate()`. Implement `CosinePdf`, `SpherePdf`, `HittablePdf`. (Book Chapter 10.1-10.2)
2. **`HittablePdf`**: Add `pdf_value()` and `random()` methods to Geometric/Quad for sampling points on surfaces. (Book Chapter 10.2, Listing 37-39)
3. **Mixture PDF**: Create `MixturePdf` that blends surface PDF + light PDF. (Book Chapter 10.3, Listing 42-43)
4. **Separate lights list**: Pass a separate `lights: &dyn Geometric` to ray_color for light sampling.
5. **Russian roulette**: Probabilistic path termination for low-energy paths. (Book — mentioned but not in a specific listing)

### Related GitHub Issues
- **Issue #8**: "Implement Techniques from Ray Tracing: The Rest of Your Life" — umbrella epic for all Book 3 techniques. Label: enhancement, engine.
- **Issue #28**: "Importance Sampling" — specific sub-task for the PDF infrastructure and sampling. Label: enhancement, engine.
- Both are by paulwrubel (the repo owner).

### Code quality notes (non-blocking, for later consideration)
- `scattering_pdf()` on Material trait is currently unused (dead code). It will be needed for NEE when the path tracer needs to evaluate BRDF at externally-chosen directions.
- `reflectance()` on Material trait may be unused in ray_color now. Check other callers before removing.
- The `skip_pdf: bool` field could become an enum (`PdfMode::Explicit(f64) | PdfMode::Delta`) for more idiomatic Rust.
- The `reflectance == Color::BLACK` early-termination optimization was removed during refactoring. Purely emissive surfaces now iterate to max_bounces with zero attenuation (correct but slightly less efficient).

## Session Notes

### The user's knowledge level
- Software engineer with math minor and hobbyist rendering interest
- Understands ray tracing mechanics, unfamiliar with BRDF/PDF/MIS terminology
- Prefers concepts explained before code
- Correctly pushed back on a mistaken claim about over-brightening (the current Lambertian code IS correct — the cosine terms cancel)
- Concerned about terminology: "light going in this direction" is confusing because the tracer traces backward
- Wants small, modular, independently-verifiable implementation steps

### Implementation preferences
- Prefers idiomatic Rust over C++ patterns (`Option<T>` over out-parameters)
- Wants the architecture to replicate current functionality first, then add new features
- Issues should be updated with detailed technical content (already done for #28)
