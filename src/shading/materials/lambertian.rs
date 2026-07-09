use std::sync::Arc;

use crate::shading::hero_wavelengths::{HERO_WAVELENGTH_COUNT, HeroWavelengths};
use crate::shading::pdf::Pdf;
use crate::{
    geometry::{Onb, Point, Ray, RayHit, Vector3},
    shading::{
        ColorSpectrum, Texture, color_spectrum::SPECTRAL_SAMPLE_COUNT, textures::SolidColor,
    },
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
    fn reflectance(&self, u: f64, v: f64, p: Point) -> ColorSpectrum<SPECTRAL_SAMPLE_COUNT> {
        self.reflectance_texture.value(u, v, p)
    }

    fn emittance(&self, u: f64, v: f64, p: Point) -> ColorSpectrum<SPECTRAL_SAMPLE_COUNT> {
        self.emittance_texture.value(u, v, p)
    }

    fn is_emissive(&self) -> bool {
        self.emittance_texture.value(0.5, 0.5, Point::ORIGIN) != ColorSpectrum::ZERO
    }

    fn is_transmissive(&self) -> bool {
        false
    }

    fn is_specular(&self) -> bool {
        false
    }

    fn scatter(
        &self,
        ray: Ray,
        ray_hit: &RayHit,
        _hw: &HeroWavelengths<HERO_WAVELENGTH_COUNT>,
    ) -> Option<ScatterRecord> {
        let ns = if ray.direction.dot(ray_hit.normal) > 0.0 {
            -ray_hit.normal
        } else {
            ray_hit.normal
        };
        Some(ScatterRecord::Pdf(Pdf::CosineHemisphere(Onb::from_w(ns))))
    }

    fn brdf(
        &self,
        _outgoing_direction: Vector3,
        _incident_direction: Vector3,
        _normal: Vector3,
        u: f64,
        v: f64,
        p: Point,
    ) -> ColorSpectrum<SPECTRAL_SAMPLE_COUNT> {
        let albedo = self.reflectance_texture.value(u, v, p);
        albedo / std::f64::consts::PI
    }
}
