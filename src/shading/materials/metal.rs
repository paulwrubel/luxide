use crate::{
    geometry::{primitives::RayHit, Ray},
    shading::Color,
};

use super::Scatter;

pub struct Metal {
    albedo: Color,
}

impl Metal {
    pub fn new(albedo: Color) -> Self {
        Self { albedo }
    }
}

impl Scatter for Metal {
    fn scatter(&self, ray: &Ray, ray_hit: &RayHit) -> Option<(Ray, Color)> {
        let reflected = ray.direction().unit_vector().reflect(&ray_hit.normal);

        Some((Ray::new(ray_hit.point, reflected), self.albedo))
    }
}
