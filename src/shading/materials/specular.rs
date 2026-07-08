use std::sync::Arc;

use crate::shading::hero_wavelengths::{HERO_WAVELENGTH_COUNT, HeroWavelengths};
use crate::{
    geometry::{Point, Ray, RayHit, Vector3},
    shading::{ColorSpectrum, Texture, color_spectrum::SPECTRAL_SAMPLE_COUNT},
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
        true
    }

    fn brdf(
        &self,
        _outgoing_direction: Vector3,
        _incident_direction: Vector3,
        _normal: Vector3,
        _u: f64,
        _v: f64,
        _p: Point,
    ) -> ColorSpectrum<SPECTRAL_SAMPLE_COUNT> {
        // delta-function BRDF — never called, bypassed via ScatterRecord::Delta
        ColorSpectrum::ZERO
    }

    fn scatter(
        &self,
        ray: Ray,
        ray_hit: &RayHit,
        _hw: &HeroWavelengths<HERO_WAVELENGTH_COUNT>,
    ) -> Option<ScatterRecord> {
        let reflected = ray.direction.unit_vector().reflect_around(ray_hit.normal);

        let scattered = Ray::new_with_medium(
            ray_hit.point,
            reflected + self.roughness * Vector3::random_unit(),
            ray.time,
            ray.current_medium,
        );

        if scattered.direction.dot(ray_hit.normal) > 0.0 {
            Some(ScatterRecord::Delta { scattered })
        } else {
            None
        }
    }
}
