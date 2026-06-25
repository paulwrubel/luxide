use std::sync::Arc;

use crate::{
    geometry::{Point, Ray, RayHit, Vector, Vector3},
    shading::{
        ColorSpectrum, Texture,
        color_spectrum::SPECTRAL_SAMPLE_COUNT,
        hero_wavelengths::{HERO_WAVELENGTH_COUNT, HeroWavelengths},
    },
};

use super::{Material, ScatterRecord, SpectralScatter};

#[derive(Debug, Clone)]
pub struct Dielectric {
    reflectance_texture: Arc<dyn Texture>,
    emittance_texture: Arc<dyn Texture>,
    index_of_refraction: f64,
}

impl Dielectric {
    pub fn new(
        reflectance_texture: Arc<dyn Texture>,
        emittance_texture: Arc<dyn Texture>,
        index_of_refraction: f64,
    ) -> Dielectric {
        Dielectric {
            reflectance_texture,
            emittance_texture,
            index_of_refraction,
        }
    }

    pub fn schlick_reflectance(cosine: f64, ref_idx: f64) -> f64 {
        let r0 = (1.0 - ref_idx) / (1.0 + ref_idx);
        let r0 = r0 * r0;
        r0 + (1.0 - r0) * (1.0 - cosine).powi(5)
    }

    /// Index of refraction at a specific wavelength using a one-term
    /// Sellmeier equation fitted from the user-provided IOR.
    ///
    /// The user's IOR is assumed to be n_D — the refractive index at the
    /// sodium D-line (589.3nm). A single Sellmeier term with an IOR-dependent
    /// C₁ provides physically plausible dispersion across a wide range of
    /// materials: shorter wavelengths → higher IOR.
    pub fn index_of_refraction_at(&self, wavelength_nm: f64) -> f64 {
        let lambda_um = wavelength_nm / 1000.0;
        let lambda_sq = lambda_um * lambda_um;

        // D-line reference wavelength in µm
        let d_um = 0.5893;
        let d_sq = d_um * d_um;

        let n_sq = self.index_of_refraction * self.index_of_refraction;

        // C₁ models the square of the UV resonance wavelength. Higher-index
        // materials have their resonance closer to the visible range, producing
        // stronger dispersion. The Sellmeier term λ²/(λ² − C₁) grows more
        // rapidly across the visible band when C₁ is larger.
        //
        // n=1.5 → C₁≈0.011  (moderate dispersion)
        // n=2.4 → C₁≈0.029  (strong dispersion, ~2.6× glass)
        let c1 = 0.005 * n_sq;

        // Solve B₁ so that n(589.3nm) = user_ior
        let b1 = (n_sq - 1.0) * (d_sq - c1) / d_sq;

        // n²(λ) = 1 + B₁·λ²/(λ² − C₁)
        let n_sq_lambda = 1.0 + b1 * lambda_sq / (lambda_sq - c1);
        n_sq_lambda.sqrt().max(1.0)
    }

    /// Compute the scattered direction for a specific wavelength using
    /// Fresnel-weighted Monte Carlo: randomly reflects or refracts
    /// proportional to Schlick reflectance, returning the appropriate
    /// attenuation weight (1.0 for reflection, 1.0 - reflectance for
    /// transmission; converges to correct Fresnel over many samples).
    pub fn refract_at(
        &self,
        incident: Vector3,
        normal: Vector3,
        wavelength_nm: f64,
    ) -> (Vector3, f64) {
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
            (unit_direction.reflect_around(refractive_normal), 1.0)
        } else {
            // refract
            (
                unit_direction.refract_around(refractive_normal, refraction_ratio),
                1.0 - reflectance,
            )
        }
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
        let mut rays = [None; HERO_WAVELENGTH_COUNT];
        let mut reflectance = Vector::<HERO_WAVELENGTH_COUNT>::ZERO;

        for (i, &lambda) in hw.iter().enumerate() {
            let (dir, refl) = self.refract_at(ray.direction, ray_hit.normal, lambda);
            reflectance[i] = refl;
            rays[i] = Some(Ray::new(ray_hit.point, dir, ray.time));
        }

        Some(ScatterRecord::Spectral(Box::new(SpectralScatter {
            rays,
            reflectance,
        })))
    }
}
