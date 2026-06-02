use std::sync::Arc;

use crate::{
    geometry::{Point, Ray, RayHit, Vector},
    shading::{Color, Texture},
};

use super::{Material, ScatterRecord};

#[derive(Debug, Clone)]
pub struct Isotropic {
    reflectance_texture: Arc<dyn Texture>,
    emittance_texture: Arc<dyn Texture>,
}

impl Isotropic {
    pub fn new(reflectance_texture: Arc<dyn Texture>, emittance_texture: Arc<dyn Texture>) -> Self {
        Self {
            reflectance_texture,
            emittance_texture,
        }
    }
}

impl Material for Isotropic {
    fn reflectance(&self, u: f64, v: f64, p: Point) -> Color {
        self.reflectance_texture.value(u, v, p)
    }

    fn emittance(&self, u: f64, v: f64, p: Point) -> Color {
        self.emittance_texture.value(u, v, p)
    }

    fn scattering_pdf(&self, _ray_in: Ray, _ray_hit: &RayHit, _scattered: &Ray) -> f64 {
        1.0 / (4.0 * std::f64::consts::PI)
    }

    fn scatter(&self, ray: Ray, ray_hit: &RayHit) -> Option<ScatterRecord> {
        // uniform sampling over the full sphere, PDF = 1/(4π)
        Some(ScatterRecord {
            attenuation: self.reflectance_texture.value(ray_hit.u, ray_hit.v, ray_hit.point),
            scattered: Ray::new(ray_hit.point, Vector::random_unit(), ray.time),
            pdf: 1.0 / (4.0 * std::f64::consts::PI),
            skip_pdf: false,
        })
    }
}
