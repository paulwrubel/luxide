use std::sync::Arc;

use crate::shading::pdf::Pdf;
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

    fn is_emissive(&self) -> bool {
        self.emittance_texture.value(0.5, 0.5, Point::ORIGIN) != Color::BLACK
    }

    fn is_transmissive(&self) -> bool {
        false
    }

    fn is_specular(&self) -> bool {
        false
    }

    fn scatter(&self, _ray: Ray, ray_hit: &RayHit) -> Option<ScatterRecord> {
        Some(ScatterRecord::Pdf(Pdf::CosineHemisphere(Onb::from_w(
            ray_hit.normal,
        ))))
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
