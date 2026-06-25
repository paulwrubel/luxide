use std::sync::Arc;

use crate::{
    geometry::{Aabb, Geometric, Point, Ray, RayHit, Vector3},
    utils::Interval,
};

/// A geometric wrapper that excludes its inner geometric from ray intersections
/// while exposing it for importance sampling. Used for "virtual guide" objects
/// that redirect rays toward their surface to improve convergence, without
/// contributing any visual output.
#[derive(Debug)]
pub struct Virtual {
    inner: Arc<dyn Geometric>,
}

impl Virtual {
    pub fn new(inner: Arc<dyn Geometric>) -> Self {
        Self { inner }
    }
}

impl Geometric for Virtual {
    fn intersect(&self, _ray: Ray, _ray_t: Interval) -> Option<RayHit> {
        // virtual geometrics never produce hits — they are invisible
        // to ray intersections and only influence importance sampling
        None
    }

    fn is_emissive(&self) -> bool {
        // material is dead code for virtual geometrics
        false
    }

    fn is_transmissive(&self) -> bool {
        // material is dead code for virtual geometrics
        false
    }

    fn is_specular(&self) -> bool {
        // material is dead code for virtual geometrics
        false
    }

    fn is_empty(&self) -> bool {
        self.inner.is_empty()
    }

    fn is_virtual(&self) -> bool {
        true
    }

    fn surface_area(&self) -> f64 {
        self.inner.surface_area()
    }

    fn bounding_box(&self) -> Aabb {
        self.inner.bounding_box()
    }

    fn sample_direction_from(&self, origin: Point) -> Vector3 {
        self.inner.sample_direction_from(origin)
    }

    fn direction_pdf(&self, origin: Point, dir: Vector3) -> f64 {
        self.inner.direction_pdf(origin, dir)
    }
}
