use crate::utils::Interval;

use super::{Aabb, Ray, RayHit};

pub trait Geometric: Sync + Send {
    fn intersect(&self, ray: Ray, ray_t: Interval) -> Option<RayHit>;
    fn bounding_box(&self) -> Aabb;
}
