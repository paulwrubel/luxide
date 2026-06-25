use super::ColorSpectrum;
use super::pdf::Pdf;
use crate::geometry::{Point, Ray, RayHit, Vector, Vector3};
use crate::shading::color_spectrum::SPECTRAL_SAMPLE_COUNT;
use crate::shading::hero_wavelengths::{HERO_WAVELENGTH_COUNT, HeroWavelengths};

mod dielectric;
pub use dielectric::Dielectric;

mod isotropic;
pub use isotropic::Isotropic;

mod lambertian;
pub use lambertian::Lambertian;

mod specular;
pub use specular::Specular;

pub trait Material: std::fmt::Debug + Sync + Send {
    fn emittance(&self, u: f64, v: f64, p: Point) -> ColorSpectrum<SPECTRAL_SAMPLE_COUNT>;

    /// Whether this material emits any light at any point on its surface.
    /// Used to build the lights list for importance sampling.
    fn is_emissive(&self) -> bool;

    /// Whether this material transmits light (glass / dielectric).
    fn is_transmissive(&self) -> bool;

    /// Whether this material reflects specularly (mirror / metal).
    fn is_specular(&self) -> bool;

    /// The raw albedo (reflectance color) of this material at a surface point.
    ///
    /// For `Delta`-variant materials (Specular, Dielectric, Isotropic), this
    /// value is used directly in the integrator as the attenuation factor.
    ///
    /// For `Pdf`-variant materials (Lambertian), the actual contribution comes
    /// from `brdf()`, but `reflectance()` is still called for early-termination:
    /// if the surface absorbs all light (returns `ColorSpectrum::ZERO`), the
    /// integrator skips scattering entirely.
    fn reflectance(&self, u: f64, v: f64, p: Point) -> ColorSpectrum<SPECTRAL_SAMPLE_COUNT>;

    fn scatter(
        &self,
        ray: Ray,
        ray_hit: &RayHit,
        hw: &HeroWavelengths<HERO_WAVELENGTH_COUNT>,
    ) -> Option<ScatterRecord>;

    /// Evaluate the BRDF (Bidirectional Reflectance Distribution Function).
    ///
    /// Returns the fraction of light arriving from `incident_direction` that
    /// is reflected toward `outgoing_direction`. This is a pure BRDF value —
    /// no cosine factor, no sampling probability.
    ///
    /// `outgoing_direction` — unit vector toward the camera (outgoing).
    /// `incident_direction` — unit vector toward the light source (incident).
    /// `normal` — the surface normal at the hit point.
    ///
    /// For delta-function materials (Specular, Dielectric), this method is
    /// never called — they bypass the BRDF path via `ScatterRecord::Delta`.
    fn brdf(
        &self,
        outgoing_direction: Vector3,
        incident_direction: Vector3,
        normal: Vector3,
        u: f64,
        v: f64,
        p: Point,
    ) -> ColorSpectrum<SPECTRAL_SAMPLE_COUNT>;
}

/// Payload for a dispersive dielectric scatter event.
/// Boxed to keep `ScatterRecord` small on the stack.
#[derive(Debug)]
pub struct SpectralScatter {
    /// One refracted ray per hero wavelength. `None` when total internal
    /// reflection occurs at that wavelength.
    pub rays: [Option<Ray>; HERO_WAVELENGTH_COUNT],
    /// Per-wavelength reflectance/transmission weight.
    pub reflectance: Vector<HERO_WAVELENGTH_COUNT>,
}

/// The result of a material scatter operation.
///
/// `Pdf` carries a sampling probability density for diffuse materials
/// (Lambertian). `Delta` is for specular/dielectric materials that have
/// a deterministic (delta-function) bounce — no finite PDF exists.
#[derive(Debug)]
pub enum ScatterRecord {
    /// The probability density function for the scatter direction.
    Pdf(Pdf),
    Delta {
        /// The scattered ray to continue tracing.
        scattered: Ray,
    },
    /// Dispersive dielectric scatter — boxed to avoid bloating the enum.
    Spectral(Box<SpectralScatter>),
}
