use std::sync::Arc;

use crate::{
    geometry::{Aabb, Geometric, Point, Ray, RayHit, Vector},
    utils::Interval,
};

#[derive(Clone)]
pub struct Translate {
    geometric: Arc<dyn Geometric>,
    translation: Vector,
    bounding_box: Aabb,
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

        self.geometric.intersect(local_ray, ray_t).map(|mut rh| {
            rh.point.0 = self.local_to_world(rh.point.0);
            rh
        })
    }

    fn surface_area(&self) -> f64 {
        self.geometric.surface_area()
    }

    fn bounding_box(&self) -> Aabb {
        self.bounding_box
    }

    fn sample_direction_from(&self, origin: Point) -> Vector {
        let local_origin = Point::from_vector(self.world_to_local(origin.0));
        // direction is invariant under translation
        self.geometric.sample_direction_from(local_origin)
    }

    fn direction_pdf(&self, origin: Point, dir: Vector) -> f64 {
        let local_origin = Point::from_vector(self.world_to_local(origin.0));
        // direction is invariant under translation; PDF is invariant
        self.geometric.direction_pdf(local_origin, dir)
    }
}
