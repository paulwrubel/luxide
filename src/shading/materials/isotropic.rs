use std::sync::Arc;

use crate::{
    geometry::{Point, Ray, RayHit, Vector3},
    shading::{ColorSpectrum, Texture, color_spectrum::SPECTRAL_SAMPLE_COUNT},
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

    fn scatter(&self, ray: Ray, ray_hit: &RayHit) -> Option<ScatterRecord> {
        // always scatter, and always scatter in a random direction
        Some(ScatterRecord::Delta {
            scattered: Ray::new(ray_hit.point, Vector3::random_unit(), ray.time),
        })
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
        albedo / (4.0 * std::f64::consts::PI)
    }
}
