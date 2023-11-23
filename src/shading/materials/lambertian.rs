use crate::{
    geometry::{primitives::RayHit, Ray, Vector},
    shading::Color,
};

use super::Scatter;

pub struct Lambertian {
    albedo: Color,
}

impl Lambertian {
    pub fn new(albedo: Color) -> Self {
        Self { albedo }
    }
}

impl Scatter for Lambertian {
    fn scatter(&self, _ray: &Ray, ray_hit: &RayHit) -> Option<(Ray, Color)> {
        let direction = ray_hit.normal + Vector::random_unit();

        // prevent degenerate rays from being generated
        let direction = if direction.is_near_zero() {
            ray_hit.normal
        } else {
            direction
        };

        let scattered = Ray::new(ray_hit.point, direction);

        Some((scattered, self.albedo))
    }
}
