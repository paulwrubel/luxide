use std::sync::Arc;

use crate::{
    geometry::{Point, Ray, RayHit, Vector},
    shading::{Color, Texture},
};

use super::{Material, ScatterRecord};

#[derive(Debug, Clone)]
pub struct Dielectric {
    reflectance_texture: Arc<dyn Texture>,
    emittance_texture: Arc<dyn Texture>,
    index_of_refraction: f64,
}

impl Dielectric {
    pub fn new(
        reflectance_texture: Arc<dyn Texture>,
        emittance_texture: Arc<dyn Texture>,
        index_of_refraction: f64,
    ) -> Dielectric {
        Dielectric {
            reflectance_texture,
            emittance_texture,
            index_of_refraction,
        }
    }

    pub fn schlick_reflectance(cosine: f64, ref_idx: f64) -> f64 {
        let r0 = (1.0 - ref_idx) / (1.0 + ref_idx);
        let r0 = r0 * r0;
        r0 + (1.0 - r0) * (1.0 - cosine).powi(5)
    }
}

impl Material for Dielectric {
    fn emittance(&self, u: f64, v: f64, p: crate::geometry::Point) -> Color {
        self.emittance_texture.value(u, v, p)
    }

    fn is_emissive(&self) -> bool {
        self.emittance_texture.value(0.5, 0.5, Point::ORIGIN) != Color::BLACK
    }

    fn is_transmissive(&self) -> bool {
        true
    }

    fn is_specular(&self) -> bool {
        false
    }

    fn reflectance(&self, u: f64, v: f64, p: Point) -> Color {
        self.reflectance_texture.value(u, v, p)
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
        let (refractive_normal, refraction_ratio) = if ray.direction.dot(ray_hit.normal) < 0.0 {
            (ray_hit.normal, 1.0 / self.index_of_refraction)
        } else {
            (-ray_hit.normal, self.index_of_refraction)
        };

        let unit_direction = ray.direction.unit_vector();
        let cos_theta = (-unit_direction).dot(refractive_normal).min(1.0);
        let sin_theta = (1.0 - cos_theta * cos_theta).sqrt();
        let cannot_refract = refraction_ratio * sin_theta > 1.0;

        let refracted = if cannot_refract
            || Dielectric::schlick_reflectance(cos_theta, refraction_ratio) > rand::random()
        {
            // cannot refract so must reflect
            unit_direction.reflect_around(refractive_normal)
        } else {
            // can refract
            unit_direction.refract_around(refractive_normal, refraction_ratio)
        };

        let scattered = Ray::new(ray_hit.point, refracted, ray.time);
        Some(ScatterRecord::Delta { scattered })
    }
}
