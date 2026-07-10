use std::sync::Arc;

use crate::{
    geometry::{Point, Ray, RayHit, Vector, Vector3},
    shading::{
        ColorSpectrum, Texture,
        color_spectrum::SPECTRAL_SAMPLE_COUNT,
        hero_wavelengths::{HERO_WAVELENGTH_COUNT, HeroWavelengths},
        medium::Medium,
    },
};

use super::{Material, ScatterRecord, SpectralScatter};

// crown glass, or close to it
const DEFAULT_ABBE_NUMBER: f64 = 64.0;

#[derive(Debug, Clone)]
pub struct Dielectric {
    reflectance_texture: Arc<dyn Texture>,
    emittance_texture: Arc<dyn Texture>,
    /// Pre-computed one-term Sellmeier coefficients (B₁, C₁), computed
    /// eagerly at construction so `index_of_refraction_at` is a cheap lookup.
    b1: f64,
    c1: f64,
    /// The interior medium of this dielectric (absorption + emission).
    /// `None` means thin-walled (straight-through transmission, no volume).
    pub medium: Option<Medium>,
}

impl Dielectric {
    pub fn new(
        reflectance_texture: Arc<dyn Texture>,
        emittance_texture: Arc<dyn Texture>,
        index_of_refraction: f64,
        abbe_number: Option<f64>,
        medium: Option<Medium>,
    ) -> Result<Dielectric, String> {
        let abbe = abbe_number.unwrap_or(DEFAULT_ABBE_NUMBER);
        if abbe <= 0.0 {
            return Err(format!("abbe_number must be positive, got {abbe}"));
        }

        let (b1, c1) = Dielectric::sellmeier_coefficients(index_of_refraction, abbe);

        Ok(Dielectric {
            reflectance_texture,
            emittance_texture,
            b1,
            c1,
            medium,
        })
    }

    pub fn schlick_reflectance(cosine: f64, ref_idx: f64) -> f64 {
        let r0 = (1.0 - ref_idx) / (1.0 + ref_idx);
        let r0 = r0 * r0;
        r0 + (1.0 - r0) * (1.0 - cosine).powi(5)
    }

    /// Index of refraction at a specific wavelength using a one-term
    /// Sellmeier equation fitted from the user-provided IOR and Abbe number.
    ///
    /// The user's IOR is assumed to be n_D — the refractive index at the
    /// sodium D-line (589.3nm). The Abbe number V_d quantifies dispersion
    /// across the visible spectrum. Coefficients are pre-computed at
    /// construction via bisection, so this is a cheap cached lookup.
    pub fn index_of_refraction_at(&self, wavelength_nm: f64) -> f64 {
        let lambda_sq = (wavelength_nm / 1000.0_f64).powi(2);
        let n_sq_lambda = 1.0 + self.b1 * lambda_sq / (lambda_sq - self.c1);
        n_sq_lambda.sqrt().max(1.0)
    }

    /// Compute the scattered direction for a specific wavelength using
    /// Fresnel-weighted Monte Carlo: randomly reflects or refracts
    /// proportional to Schlick reflectance, which converges to
    /// correct Fresnel over many samples).
    pub fn refract_at(
        &self,
        incident: Vector3,
        normal: Vector3,
        wavelength_nm: f64,
    ) -> (Vector3, bool) {
        let ior = self.index_of_refraction_at(wavelength_nm);
        let (refractive_normal, refraction_ratio) = if incident.dot(normal) < 0.0 {
            (normal, 1.0 / ior)
        } else {
            (-normal, ior)
        };

        let unit_direction = incident.unit_vector();
        let cos_theta = (-unit_direction).dot(refractive_normal).min(1.0);
        let sin_theta = (1.0 - cos_theta * cos_theta).sqrt();
        let cannot_refract = refraction_ratio * sin_theta > 1.0;

        let reflectance = Self::schlick_reflectance(cos_theta, refraction_ratio);

        if cannot_refract || reflectance > rand::random() {
            // reflect (TIR or Schlick flip chose reflection)
            (unit_direction.reflect_around(refractive_normal), true)
        } else {
            // refract
            (
                unit_direction.refract_around(refractive_normal, refraction_ratio),
                false,
            )
        }
    }

    fn scatter_volumetric(
        &self,
        ray: &Ray,
        ray_hit: &RayHit,
        hw: &HeroWavelengths<HERO_WAVELENGTH_COUNT>,
        medium: Medium,
    ) -> Option<ScatterRecord> {
        let entering = ray.direction.dot(ray_hit.normal) < 0.0;

        let mut rays: [Option<Ray>; HERO_WAVELENGTH_COUNT] = std::array::from_fn(|_| None);
        let mut reflectance = Vector::<HERO_WAVELENGTH_COUNT>::ONE;

        for (i, &lambda) in hw.iter().enumerate() {
            let (next_dir, reflected) = self.refract_at(ray.direction, ray_hit.normal, lambda);

            // apply reflectance texture as an optional reflection tint
            // (non-physical but useful for coated-glass effects)
            if reflected {
                let tint = self
                    .reflectance_texture
                    .value(ray_hit.u, ray_hit.v, ray_hit.point);
                reflectance[i] *= tint.sample_wavelength(lambda);
            }

            // Determine the medium the outgoing ray travels through.
            // A refracting ray crosses the interface; a reflecting ray stays.
            let new_medium = if reflected {
                ray.current_medium
            } else if entering {
                medium
            } else {
                // this will be replaced with the true outer media from the caller, since
                // we have no way here of knowing it.
                //
                // (and I didn't want each Ray or the scatter function to
                // keep track of the full media stack)
                Medium::Vacuum
            };

            rays[i] = Some(Ray::new_with_medium(
                ray_hit.point,
                next_dir,
                ray.time,
                new_medium,
            ));
        }

        Some(ScatterRecord::Spectral(Box::new(SpectralScatter {
            rays,
            reflectance,
        })))
    }

    /// Thin-slab BSDF: analytically sums the geometric series of internal
    /// Fresnel reflections between two parallel interfaces.
    ///
    /// R_total = 2R/(1+R), T_total = (1-R)/(1+R).
    /// A single random decision chooses reflection vs. straight-through
    /// transmission for all wavelengths. The transmitted lobe applies
    /// the `attenuation_color` as a per-crossing multiply.
    fn scatter_thin(
        &self,
        ray: &Ray,
        ray_hit: &RayHit,
        hw: &HeroWavelengths<HERO_WAVELENGTH_COUNT>,
    ) -> Option<ScatterRecord> {
        // cos_theta uses abs() — both faces of a thin sheet are equivalent
        let cos_theta = (-ray.direction.unit_vector())
            .dot(ray_hit.normal)
            .abs()
            .min(1.0);

        let mut r_total = Vector::<HERO_WAVELENGTH_COUNT>::ZERO;
        let mut sum_r = 0.0;
        for (i, &lambda) in hw.iter().enumerate() {
            let ior = self.index_of_refraction_at(lambda);
            let r = Self::schlick_reflectance(cos_theta, ior);
            r_total[i] = 2.0 * r / (1.0 + r);
            sum_r += r_total[i];
        }
        let avg_r = sum_r / HERO_WAVELENGTH_COUNT as f64;

        let mut rays: [Option<Ray>; HERO_WAVELENGTH_COUNT] = std::array::from_fn(|_| None);
        let mut reflectance = Vector::<HERO_WAVELENGTH_COUNT>::ZERO;

        // single direction decision: reflect or transmit straight through.
        // This matches the Mitsuba thindielectric / PBRT thin-dielectric
        // behavior — one decision for all wavelengths.
        if rand::random::<f64>() < avg_r {
            // reflect: both faces contribute via the analytic sum
            let reflected = (-ray.direction)
                .unit_vector()
                .reflect_around(ray_hit.normal);
            for i in 0..HERO_WAVELENGTH_COUNT {
                rays[i] = Some(Ray::new_with_medium(
                    ray_hit.point,
                    reflected,
                    ray.time,
                    ray.current_medium,
                ));
                let tint = self
                    .reflectance_texture
                    .value(ray_hit.u, ray_hit.v, ray_hit.point)
                    .sample_wavelength(hw[i]);
                reflectance[i] = r_total[i] * tint;
            }
        } else {
            // "refraction" time
            //
            // a "double-paned" infinitely thin sheet HAS NO refraction!
            // so the Ray essentially continues in the same direction!
            for i in 0..HERO_WAVELENGTH_COUNT {
                rays[i] = Some(Ray::new_with_medium(
                    ray_hit.point,
                    ray.direction.unit_vector(),
                    ray.time,
                    ray.current_medium,
                ));
                let t_total = 1.0 - r_total[i];
                // Thin sheets have no interior — the reflectance texture
                // IS the material's color. Apply to transmission as well.
                let tint = self
                    .reflectance_texture
                    .value(ray_hit.u, ray_hit.v, ray_hit.point)
                    .sample_wavelength(hw[i]);
                reflectance[i] = t_total * tint;
            }
        }

        Some(ScatterRecord::Spectral(Box::new(SpectralScatter {
            rays,
            reflectance,
        })))
    }

    /// Fit (B₁, C₁) of a one-term Sellmeier model satisfying two constraints:
    ///   1. n(589.3 nm) == n_d           (D-line, user-provided IOR)
    ///   2. the model's Abbe number == v
    ///
    /// The three standard Fraunhofer reference wavelengths used:
    ///   F  — 486.1 nm (hydrogen, blue)
    ///   d  — 589.3 nm (sodium D-line; matches user IOR convention)
    ///   C  — 656.3 nm (hydrogen, red)
    fn sellmeier_coefficients(n_d: f64, v: f64) -> (f64, f64) {
        let n_sq = n_d * n_d;

        // reference wavelengths² (µm²)
        let d_sq = 0.5893_f64.powi(2);
        let f_sq = 0.4861_f64.powi(2);
        let c_sq = 0.6563_f64.powi(2);

        // n at a wavelength λ² for a given C₁, with B₁ fixed by the
        // D-line constraint: B₁ = (n² − 1)·(λ_D² − C₁)/λ_D²
        let n_at = |lam_sq: f64, c1: f64| -> f64 {
            let b1 = (n_sq - 1.0) * (d_sq - c1) / d_sq;
            (1.0 + b1 * lam_sq / (lam_sq - c1)).sqrt()
        };

        // residual(C₁) = Vd_model − Vd_target. Monotonic decreasing in
        // C₁ — larger C₁ pushes UV resonance toward visible → stronger
        // dispersion → smaller Abbe number → negative residual.
        let residual = |c1: f64| -> f64 { (n_d - 1.0) / (n_at(f_sq, c1) - n_at(c_sq, c1)) - v };

        // bisection: bracket C₁ in (0, λ_F²) since the Sellmeier pole
        // must lie below the shortest reference wavelength.
        let (mut lo, mut hi) = (1e-12, f_sq - 1e-12);
        for _ in 0..100 {
            let mid = 0.5 * (lo + hi);
            if residual(lo) * residual(mid) <= 0.0 {
                hi = mid;
            } else {
                lo = mid;
            }
        }
        let c1 = 0.5 * (lo + hi);

        // Back out B₁ from the D-line constraint
        let b1 = (n_sq - 1.0) * (d_sq - c1) / d_sq;
        (b1, c1)
    }
}

impl Material for Dielectric {
    fn emittance(
        &self,
        u: f64,
        v: f64,
        p: crate::geometry::Point,
    ) -> ColorSpectrum<SPECTRAL_SAMPLE_COUNT> {
        self.emittance_texture.value(u, v, p)
    }

    fn is_emissive(&self) -> bool {
        self.emittance_texture.value(0.5, 0.5, Point::ORIGIN) != ColorSpectrum::ZERO
    }

    fn is_transmissive(&self) -> bool {
        true
    }

    fn is_specular(&self) -> bool {
        false
    }

    fn reflectance(&self, u: f64, v: f64, p: Point) -> ColorSpectrum<SPECTRAL_SAMPLE_COUNT> {
        self.reflectance_texture.value(u, v, p)
    }

    fn brdf(
        &self,
        _outgoing_direction: Vector3,
        _incident_direction: Vector3,
        _normal: Vector3,
        _u: f64,
        _v: f64,
        _p: Point,
    ) -> ColorSpectrum<SPECTRAL_SAMPLE_COUNT> {
        // delta-function BRDF — never called, bypassed via ScatterRecord::Delta
        ColorSpectrum::ZERO
    }

    fn scatter(
        &self,
        ray: Ray,
        ray_hit: &RayHit,
        hw: &HeroWavelengths<HERO_WAVELENGTH_COUNT>,
    ) -> Option<ScatterRecord> {
        if let Some(medium) = self.medium {
            self.scatter_volumetric(&ray, ray_hit, hw, medium)
        } else {
            self.scatter_thin(&ray, ray_hit, hw)
        }
    }
}
