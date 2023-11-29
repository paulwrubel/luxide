use std::sync::Arc;

use crate::{
    geometry::{Point, Ray, RayHit, Vector},
    shading::{textures::SolidColor, Color, Texture},
};

use super::Material;

pub struct Lambertian {
    reflectance_texture: Arc<dyn Texture>,
    emittance_texture: Arc<dyn Texture>,
}

impl Lambertian {
    pub fn new(reflectance_texture: Arc<dyn Texture>, emittance_texture: Arc<dyn Texture>) -> Self {
        Self {
            reflectance_texture,
            emittance_texture,
        }
    }

    pub fn black() -> Self {
        let black: Arc<dyn Texture> = Arc::new(SolidColor::BLACK);
        Self {
            reflectance_texture: Arc::clone(&black),
            emittance_texture: Arc::clone(&black),
        }
    }

    pub fn white() -> Self {
        let white: Arc<dyn Texture> = Arc::new(SolidColor::WHITE);
        Self {
            reflectance_texture: Arc::clone(&white),
            emittance_texture: Arc::clone(&white),
        }
    }
}

impl Material for Lambertian {
    fn reflectance(&self, u: f64, v: f64, p: Point) -> Color {
        self.reflectance_texture.value(u, v, p)
    }

    fn emittance(&self, u: f64, v: f64, p: Point) -> Color {
        self.emittance_texture.value(u, v, p)
    }

    fn scatter(&self, ray: Ray, ray_hit: &RayHit) -> Option<Ray> {
        let direction = ray_hit.normal + Vector::random_unit();

        // prevent degenerate rays from being generated
        let direction = if direction.is_near_zero() {
            ray_hit.normal
        } else {
            direction
        };

        let scattered = Ray::new(ray_hit.point, direction, ray.time);

        Some(scattered)
    }
}
