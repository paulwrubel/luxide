use crate::{
    geometry::{Ray, RayHit},
    shading::Color,
};

use super::Scatter;

pub struct Dielectric {
    index_of_refraction: f64,
}

impl Dielectric {
    pub fn new(index_of_refraction: f64) -> Dielectric {
        Dielectric {
            index_of_refraction,
        }
    }

    pub fn schlick_reflectance(cosine: f64, ref_idx: f64) -> f64 {
        let r0 = (1.0 - ref_idx) / (1.0 + ref_idx);
        let r0 = r0 * r0;
        r0 + (1.0 - r0) * (1.0 - cosine).powi(5)
    }
}

impl Scatter for Dielectric {
    fn scatter(&self, ray: &Ray, ray_hit: &RayHit) -> Option<(Ray, Color)> {
        let attenuation = Color::new(1.0, 1.0, 1.0);
        let (refractive_normal, refraction_ratio) = if ray.direction.dot(&ray_hit.normal) < 0.0 {
            (ray_hit.normal, 1.0 / self.index_of_refraction)
        } else {
            (-ray_hit.normal, self.index_of_refraction)
        };

        let unit_direction = ray.direction.unit_vector();
        let cos_theta = (-unit_direction).dot(&refractive_normal).min(1.0);
        let sin_theta = (1.0 - cos_theta * cos_theta).sqrt();
        let cannot_refract = refraction_ratio * sin_theta > 1.0;

        let refracted = if cannot_refract
            || Dielectric::schlick_reflectance(cos_theta, refraction_ratio) > rand::random()
        {
            // cannot refract so must reflect
            unit_direction.reflect_around(&refractive_normal)
        } else {
            // can refract
            unit_direction.refract_around(&refractive_normal, refraction_ratio)
        };

        let scattered = Ray::new(ray_hit.point, refracted, ray.time);
        Some((scattered, attenuation))
    }
}
