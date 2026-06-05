use std::sync::Arc;

use crate::shading::pdf::{CosineHemispherePdf, Pdf};
use crate::{
    geometry::{Point, Ray, RayHit, Vector},
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

    fn scatter(&self, ray: Ray, ray_hit: &RayHit) -> Option<ScatterRecord> {
        let pdf = CosineHemispherePdf::new(ray_hit.normal);
        let direction = pdf.sample();

        Some(ScatterRecord::Pdf {
            scattered: Ray::new(ray_hit.point, direction, ray.time),
            pdf: pdf.density(direction),
        })
    }

    fn brdf(
        &self,
        _outgoing_direction: Vector,
        _incident_direction: Vector,
        _normal: Vector,
        u: f64,
        v: f64,
        p: Point,
    ) -> Color {
        let albedo = self.reflectance_texture.value(u, v, p);
        albedo / std::f64::consts::PI
    }
}
