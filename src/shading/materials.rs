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

/// The result of a material scatter operation.
///
/// `Pdf` carries a sampling probability density for diffuse materials
/// (Lambertian). `Delta` is for specular/dielectric materials that have
/// a deterministic (delta-function) bounce — no finite PDF exists.
#[derive(Debug, Clone)]
pub enum ScatterRecord {
    Pdf {
        /// The scattered ray to continue tracing.
        scattered: Ray,
        /// The solid-angle probability density of the chosen scatter direction.
        pdf: f64,
    },
    Delta {
        /// The scattered ray to continue tracing.
        scattered: Ray,
    },
}

pub trait Material: std::fmt::Debug + Sync + Send {
    fn reflectance(&self, u: f64, v: f64, p: Point) -> Color;
    fn emittance(&self, u: f64, v: f64, p: Point) -> Color;
    fn scatter(&self, ray: Ray, ray_hit: &RayHit) -> Option<ScatterRecord>;
}
