use std::sync::Arc;

use crate::{
    geometry::{Point, Ray, RayHit, Vector},
    shading::{Color, Texture},
};

use super::Material;

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

    fn scatter(&self, ray: Ray, ray_hit: &RayHit) -> Option<Ray> {
        // always scatter, and always scatter in a random direction
        Some(Ray::new(ray_hit.point, Vector::random_unit(), ray.time))
    }
}
