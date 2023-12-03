use std::sync::Arc;

use crate::{
    geometry::{primitives::AABB, Intersect, Ray, RayHit},
    utils::Interval,
};

#[derive(Clone)]
pub struct ReverseNormals(Arc<dyn Intersect>);

impl ReverseNormals {
    pub fn new(intersectable: Arc<dyn Intersect>) -> Self {
        Self(Arc::clone(&intersectable))
    }
}

impl Intersect for ReverseNormals {
    fn intersect(&self, ray: Ray, ray_t: Interval) -> Option<RayHit> {
        self.0.intersect(ray, ray_t).and_then(|mut rh| {
            rh.normal = -rh.normal;
            Some(rh)
        })
    }

    fn bounding_box(&self) -> AABB {
        self.0.bounding_box()
    }
}
