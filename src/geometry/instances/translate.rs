use std::sync::Arc;

use crate::{
    geometry::{Geometric, Ray, RayHit, Vector, AABB},
    utils::Interval,
};

#[derive(Debug, Clone)]
pub struct Translate {
    geometric: Arc<dyn Geometric>,
    translation: Vector,
    bounding_box: AABB,
}

impl Translate {
    pub fn new(geometric: Arc<dyn Geometric>, translation: Vector) -> Self {
        let bounding_box = geometric.bounding_box() + translation;
        Self {
            geometric: Arc::clone(&geometric),
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

impl Geometric for Translate {
    fn intersect(&self, ray: Ray, ray_t: Interval) -> Option<RayHit> {
        let mut local_ray = ray;

        local_ray.origin.0 = self.world_to_local(local_ray.origin.0);

        self.geometric
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
