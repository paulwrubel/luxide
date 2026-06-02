use std::sync::Arc;

use crate::{
    geometry::{Onb, Point, Ray, RayHit, Vector},
    shading::{Color, Texture, textures::SolidColor},
};

use super::{Material, ScatterRecord};

#[derive(Debug, Clone)]
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

    fn scattering_pdf(&self, _ray_in: Ray, ray_hit: &RayHit, scattered: &Ray) -> f64 {
        let cos_theta = ray_hit.normal.dot(scattered.direction.unit_vector());
        if cos_theta < 0.0 {
            0.0
        } else {
            cos_theta / std::f64::consts::PI
        }
    }

    fn scatter(&self, ray: Ray, ray_hit: &RayHit) -> Option<ScatterRecord> {
        let onb = Onb::build_from_w(ray_hit.normal);
        let direction = onb.local_from_vec(Vector::random_cosine_direction());
        let cos_theta = ray_hit.normal.dot(direction);
        Some(ScatterRecord {
            attenuation: self.reflectance_texture.value(ray_hit.u, ray_hit.v, ray_hit.point),
            scattered: Ray::new(ray_hit.point, direction, ray.time),
            pdf: if cos_theta < 0.0 { 0.0 } else { cos_theta / std::f64::consts::PI },
            skip_pdf: false,
        })
    }
}
