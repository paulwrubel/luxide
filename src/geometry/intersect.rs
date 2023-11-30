use dyn_clone::DynClone;

use crate::utils::Interval;

use super::{primitives::AABB, Ray, RayHit};

pub trait Intersect: DynClone + Sync + Send {
    fn intersect(&self, ray: Ray, ray_t: Interval) -> Option<RayHit>;
    fn bounding_box(&self) -> AABB;
}

dyn_clone::clone_trait_object!(Intersect);
