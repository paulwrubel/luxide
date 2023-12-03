use std::sync::Arc;

use rand::Rng;

use crate::{
    geometry::{primitives::AABB, Geometric, Ray, RayHit, Vector},
    shading::{
        materials::{Isotropic, Material},
        textures::SolidColor,
        Texture,
    },
    utils::Interval,
};

#[derive(Clone)]
pub struct Constant {
    geometric: Arc<dyn Geometric>,
    negative_inverse_density: f64,
    phase_function: Arc<dyn Material>,
}

impl Constant {
    pub fn new(
        geometric: Arc<dyn Geometric>,
        density: f64,
        reflectance_texture: Arc<dyn Texture>,
    ) -> Self {
        let emittance_texture = Arc::new(SolidColor::BLACK);
        Self {
            geometric: Arc::clone(&geometric),
            negative_inverse_density: -1.0 / density,
            phase_function: Arc::new(Isotropic::new(reflectance_texture, emittance_texture)),
        }
    }
}

impl Geometric for Constant {
    fn intersect(&self, ray: Ray, ray_t: Interval) -> Option<RayHit> {
        // check for first intersection, which may be behind us
        let first_interval = Interval::UNIVERSE;
        let mut first_hit = match self.geometric.intersect(ray, first_interval) {
            Some(hit) => hit,
            None => return None,
        };

        // check for second intersection, which is just any intersection past the first one.
        // this could still be behind us
        let second_interval = Interval::new(first_hit.t + 0.0001, f64::INFINITY);
        let mut second_hit = match self.geometric.intersect(ray, second_interval) {
            Some(hit) => hit,
            None => return None,
        };

        // if our first hit is behind us, set it to the minimum we desire
        if first_hit.t < ray_t.minimum {
            first_hit.t = ray_t.minimum;
        }
        // if the second his is past our limit, set it to the maximum we desire
        if second_hit.t > ray_t.maximum {
            second_hit.t = ray_t.maximum;
        }

        // if the first hit is after the second hit, the volume is outside our reach, meaning
        // is it either entirely behind our range (behind us) or entirely past our range (in front of us)
        if first_hit.t >= second_hit.t {
            return None;
        }

        if first_hit.t < 0.0 {
            first_hit.t = 0.0;
        }

        let ray_length = ray.direction.length();
        let distance_inside_boundary = (second_hit.t - first_hit.t) * ray_length;
        let hit_distance: f64 =
            self.negative_inverse_density * rand::thread_rng().gen::<f64>().ln();

        // check if the ray made it through the volume
        if hit_distance > distance_inside_boundary {
            return None;
        }

        let t = first_hit.t + hit_distance / ray_length;
        Some(RayHit {
            t,
            point: ray.at(t),
            normal: Vector::RIGHT, // arbitrary
            material: Arc::clone(&self.phase_function),
            u: 0.0, // arbitrary
            v: 0.0, // arbitrary
        })
    }

    fn bounding_box(&self) -> AABB {
        self.geometric.bounding_box()
    }
}
