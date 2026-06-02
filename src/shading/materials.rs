use super::Color;
use crate::geometry::{Point, Ray, RayHit};

mod dielectric;
pub use dielectric::Dielectric;

mod isotropic;
pub use isotropic::Isotropic;

mod lambertian;
pub use lambertian::Lambertian;

mod specular;
pub use specular::Specular;

/// Bundles the result of a material scatter operation.
/// Returned as `Some(ScatterRecord)` from `Material::scatter()` when scattering
/// occurs, or `None` when the ray is absorbed.
#[derive(Debug, Clone)]
pub struct ScatterRecord {
    /// The attenuation (albedo/reflectance) of the surface at the hit point.
    /// This is the fraction of incoming light that gets reflected.
    pub attenuation: Color,
    /// The scattered ray to continue tracing.
    pub scattered: Ray,
    /// The probability density of the generated scattered direction.
    /// For diffuse materials (Lambertian, Isotropic): the sampling PDF.
    /// For specular/dielectric delta-function materials: 0.0.
    pub pdf: f64,
    /// Whether to skip the PDF division in the path tracer.
    /// true for specular/dielectric (delta-function BRDFs where pdf is meaningless).
    /// false for diffuse materials where pdf represents a real sampling distribution.
    pub skip_pdf: bool,
}

pub trait Material: std::fmt::Debug + Sync + Send {
    fn reflectance(&self, u: f64, v: f64, p: Point) -> Color;
    fn emittance(&self, u: f64, v: f64, p: Point) -> Color;
    /// Attempt to scatter a ray off this material.
    /// Returns `Some(ScatterRecord)` if the ray scattered, `None` if absorbed.
    fn scatter(&self, ray: Ray, ray_hit: &RayHit) -> Option<ScatterRecord>;
    fn scattering_pdf(&self, _ray_in: Ray, _ray_hit: &RayHit, _scattered: &Ray) -> f64 {
        0.0
    }
}
