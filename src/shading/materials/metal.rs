use crate::{
    geometry::{primitives::RayHit, Ray, Vector},
    shading::Color,
};

use super::Scatter;

pub struct Metal {
    albedo: Color,
    fuzziness: f64,
}

impl Metal {
    pub fn new(albedo: Color, fuzziness: f64) -> Self {
        Self {
            albedo,
            fuzziness: fuzziness.min(1.0).max(0.0),
        }
    }
}

impl Scatter for Metal {
    fn scatter(&self, ray: &Ray, ray_hit: &RayHit) -> Option<(Ray, Color)> {
        let reflected = ray.direction().unit_vector().reflect(&ray_hit.normal);

        let scattered = Ray::new(
            ray_hit.point,
            reflected + self.fuzziness * Vector::random_unit(),
        );

        if scattered.direction().dot(&ray_hit.normal) > 0.0 {
            Some((scattered, self.albedo))
        } else {
            None
        }
    }
}
