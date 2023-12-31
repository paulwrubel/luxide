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

pub trait Material: std::fmt::Debug + Sync + Send {
    fn reflectance(&self, u: f64, v: f64, p: Point) -> Color;
    fn emittance(&self, u: f64, v: f64, p: Point) -> Color;
    fn scatter(&self, ray: Ray, ray_hit: &RayHit) -> Option<Ray>;
}
