use crate::utils::Interval;

use super::{primitives::AABB, Ray, RayHit};

pub trait Intersect {
    fn intersect(&self, ray: &Ray, ray_t: Interval) -> Option<RayHit>;
    fn bounding_box(&self) -> AABB;
}
