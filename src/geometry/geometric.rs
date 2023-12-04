use crate::utils::Interval;

use super::{Ray, RayHit, AABB};

pub trait Geometric: std::fmt::Debug + Sync + Send {
    fn intersect(&self, ray: Ray, ray_t: Interval) -> Option<RayHit>;
    fn bounding_box(&self) -> AABB;
}
