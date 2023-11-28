use std::sync::Arc;

use crate::{
    geometry::{Ray, RayHit, Vector},
    shading::{Color, Texture},
};

use super::Material;

pub struct Specular {
    reflectance_texture: Arc<dyn Texture>,
    emittance_texture: Arc<dyn Texture>,
    fuzziness: f64,
}

impl Specular {
    pub fn new(
        reflectance_texture: Arc<dyn Texture>,
        emittance_texture: Arc<dyn Texture>,
        fuzziness: f64,
    ) -> Self {
        Self {
            reflectance_texture,
            emittance_texture,
            fuzziness: fuzziness.min(1.0).max(0.0),
        }
    }
}

impl Material for Specular {
    fn reflectance(&self, u: f64, v: f64, p: crate::geometry::Point) -> Color {
        self.reflectance_texture.value(u, v, p)
    }

    fn emittance(&self, u: f64, v: f64, p: crate::geometry::Point) -> Color {
        self.emittance_texture.value(u, v, p)
    }

    fn scatter(&self, ray: Ray, ray_hit: &RayHit) -> Option<Ray> {
        let reflected = ray.direction.unit_vector().reflect_around(ray_hit.normal);

        let scattered = Ray::new(
            ray_hit.point,
            reflected + self.fuzziness * Vector::random_unit(),
            ray.time,
        );

        if scattered.direction.dot(ray_hit.normal) > 0.0 {
            Some(scattered)
        } else {
            None
        }
    }
}
