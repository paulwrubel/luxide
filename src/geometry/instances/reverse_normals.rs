use std::sync::Arc;

use crate::{
    geometry::{Geometric, Ray, RayHit, AABB},
    utils::Interval,
};

#[derive(Clone)]
pub struct ReverseNormals(Arc<dyn Geometric>);

impl ReverseNormals {
    pub fn new(geometric: Arc<dyn Geometric>) -> Self {
        Self(Arc::clone(&geometric))
    }
}

impl Geometric for ReverseNormals {
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
