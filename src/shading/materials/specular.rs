use std::sync::Arc;

use crate::{
    geometry::{Ray, RayHit, Vector},
    shading::{Color, Texture},
};

use super::Scatter;

pub struct Specular {
    albedo: Arc<dyn Texture>,
    fuzziness: f64,
}

impl Specular {
    pub fn new(albedo: Arc<dyn Texture>, fuzziness: f64) -> Self {
        Self {
            albedo,
            fuzziness: fuzziness.min(1.0).max(0.0),
        }
    }
}

impl Scatter for Specular {
    fn scatter(&self, ray: Ray, ray_hit: &RayHit) -> Option<(Ray, Color)> {
        let reflected = ray.direction.unit_vector().reflect_around(ray_hit.normal);

        let scattered = Ray::new(
            ray_hit.point,
            reflected + self.fuzziness * Vector::random_unit(),
            ray.time,
        );

        if scattered.direction.dot(ray_hit.normal) > 0.0 {
            Some((
                scattered,
                self.albedo.value(ray_hit.u, ray_hit.v, ray_hit.point),
            ))
        } else {
            None
        }
    }
}
