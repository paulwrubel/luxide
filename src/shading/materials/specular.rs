use std::sync::Arc;

use crate::{
    geometry::{Point, Ray, RayHit, Vector},
    shading::{Color, Texture},
};

use super::{Material, ScatterRecord};

#[derive(Debug, Clone)]
pub struct Specular {
    reflectance_texture: Arc<dyn Texture>,
    emittance_texture: Arc<dyn Texture>,
    roughness: f64,
}

impl Specular {
    pub fn new(
        reflectance_texture: Arc<dyn Texture>,
        emittance_texture: Arc<dyn Texture>,
        roughness: f64,
    ) -> Self {
        Self {
            reflectance_texture,
            emittance_texture,
            roughness: roughness.clamp(0.0, 1.0),
        }
    }
}

impl Material for Specular {
    fn reflectance(&self, u: f64, v: f64, p: Point) -> Color {
        self.reflectance_texture.value(u, v, p)
    }

    fn emittance(&self, u: f64, v: f64, p: Point) -> Color {
        self.emittance_texture.value(u, v, p)
    }

    fn brdf(
        &self,
        _outgoing_direction: Vector,
        _incident_direction: Vector,
        _normal: Vector,
        _u: f64,
        _v: f64,
        _p: Point,
    ) -> Color {
        // delta-function BRDF — never called, bypassed via ScatterRecord::Delta
        Color::BLACK
    }

    fn scatter(&self, ray: Ray, ray_hit: &RayHit) -> Option<ScatterRecord> {
        let reflected = ray.direction.unit_vector().reflect_around(ray_hit.normal);

        let scattered = Ray::new(
            ray_hit.point,
            reflected + self.roughness * Vector::random_unit(),
            ray.time,
        );

        if scattered.direction.dot(ray_hit.normal) > 0.0 {
            Some(ScatterRecord::Delta { scattered })
        } else {
            None
        }
    }
}
