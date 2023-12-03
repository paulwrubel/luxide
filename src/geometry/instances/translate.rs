use std::sync::Arc;

use crate::{
    geometry::{primitives::AABB, Intersect, Ray, RayHit, Vector},
    utils::Interval,
};

#[derive(Clone)]
pub struct Translate {
    primitive: Arc<dyn Intersect>,
    translation: Vector,
    bounding_box: AABB,
}

impl Translate {
    pub fn new(primitive: Arc<dyn Intersect>, translation: Vector) -> Self {
        let bounding_box = primitive.bounding_box() + translation;
        Self {
            primitive: Arc::clone(&primitive),
            translation,
            bounding_box,
        }
    }

    fn world_to_local(&self, v: Vector) -> Vector {
        v - self.translation
    }

    fn local_to_world(&self, v: Vector) -> Vector {
        v + self.translation
    }
}

impl Intersect for Translate {
    fn intersect(&self, ray: Ray, ray_t: Interval) -> Option<RayHit> {
        let mut local_ray = ray;

        local_ray.origin.0 = self.world_to_local(local_ray.origin.0);

        self.primitive
            .intersect(local_ray, ray_t)
            .and_then(|mut rh| {
                rh.point.0 = self.local_to_world(rh.point.0);
                Some(rh)
            })
    }

    fn bounding_box(&self) -> AABB {
        self.bounding_box
    }
}
