use super::Color;
use crate::geometry::{primitives::RayHit, Ray};

mod lambertian;
pub use lambertian::Lambertian;

mod metal;
pub use metal::Metal;

pub trait Scatter {
    fn scatter(&self, ray: &Ray, ray_hit: &RayHit) -> Option<(Ray, Color)>;
}
