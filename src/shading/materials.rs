use super::Color;
use crate::geometry::{Ray, RayHit};

mod dielectric;
pub use dielectric::Dielectric;

mod lambertian;
pub use lambertian::Lambertian;

mod specular;
pub use specular::Specular;

pub trait Scatter {
    fn scatter(&self, ray: &Ray, ray_hit: &RayHit) -> Option<(Ray, Color)>;
}
