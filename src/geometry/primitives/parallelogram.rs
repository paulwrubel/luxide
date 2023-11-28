use std::sync::Arc;

use crate::{
    geometry::{Intersect, Point, Ray, RayHit, Vector},
    shading::materials::Material,
    utils::Interval,
};

use super::AABB;

pub struct Parallelogram {
    lower_left: Point,
    u: Vector,
    v: Vector,
    normal: Vector,
    plane_d: f64,
    w: Vector,
    material: Arc<dyn Material>,
    bounding_box: AABB,
}

impl Parallelogram {
    pub fn new(lower_left: Point, u: Vector, v: Vector, material: Arc<dyn Material>) -> Self {
        let n = u.cross(v);
        let normal = n.unit_vector();
        Self {
            lower_left,
            u,
            v,
            normal,
            plane_d: lower_left.0.dot(normal),
            w: n / n.dot(n),
            material,
            bounding_box: AABB::from_points(lower_left, lower_left + u + v).pad(0.0001),
        }
    }
}

impl Intersect for Parallelogram {
    fn intersect(&self, ray: Ray, ray_t: Interval) -> Option<RayHit> {
        let denominator = self.normal.dot(ray.direction);

        // if the ray is parallel to the plane, then there is no intersection
        if denominator.abs() <= 1e-8 {
            return None;
        }

        let t = (self.plane_d - self.normal.dot(ray.origin.0)) / denominator;
        if !ray_t.contains_including(t) {
            return None;
        }

        let point = ray.at(t);
        let lower_left_to_hitpoint = self.lower_left.to(point);

        let alpha = self.w.dot(lower_left_to_hitpoint.cross(self.v));
        let beta = self.w.dot(self.u.cross(lower_left_to_hitpoint));

        let valid_alpha_range = Interval::new(0.0, 1.0);
        let valid_beta_range = Interval::new(0.0, 1.0);

        if !valid_alpha_range.contains_including(alpha)
            || !valid_beta_range.contains_including(beta)
        {
            return None;
        }

        let u = alpha;
        let v = beta;

        Some(RayHit {
            t,
            point,
            normal: self.normal,
            material: Arc::clone(&self.material),
            u,
            v,
        })
    }

    fn bounding_box(&self) -> AABB {
        self.bounding_box
    }
}
