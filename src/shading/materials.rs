use super::Color;
use super::pdf::Pdf;
use crate::geometry::{Point, Ray, RayHit, Vector};

mod dielectric;
pub use dielectric::Dielectric;

mod isotropic;
pub use isotropic::Isotropic;

mod lambertian;
pub use lambertian::Lambertian;

mod specular;
pub use specular::Specular;

pub trait Material: std::fmt::Debug + Sync + Send {
    fn emittance(&self, u: f64, v: f64, p: Point) -> Color;

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
    /// if the surface absorbs all light (returns `Color::BLACK`), the integrator
    /// skips scattering entirely.
    fn reflectance(&self, u: f64, v: f64, p: Point) -> Color;

    fn scatter(&self, ray: Ray, ray_hit: &RayHit) -> Option<ScatterRecord>;

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
        outgoing_direction: Vector,
        incident_direction: Vector,
        normal: Vector,
        u: f64,
        v: f64,
        p: Point,
    ) -> Color;
}

/// The result of a material scatter operation.
///
/// `Pdf` carries a sampling probability density for diffuse materials
/// (Lambertian). `Delta` is for specular/dielectric materials that have
/// a deterministic (delta-function) bounce — no finite PDF exists.
#[derive(Debug)]
pub enum ScatterRecord {
    Pdf {
        /// The probability density function for the scatter direction.
        pdf: Box<dyn Pdf>,
    },
    Delta {
        /// The scattered ray to continue tracing.
        scattered: Ray,
    },
}
