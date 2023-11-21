use crate::geometry::{Point, Ray};

use super::{Hit, RayHit};

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Sphere {
    center: Point,
    radius: f64,
}

impl Sphere {
    pub fn new(center: Point, radius: f64) -> Self {
        Self { center, radius }
    }

    pub fn center(&self) -> Point {
        self.center
    }

    pub fn radius(&self) -> f64 {
        self.radius
    }
}

impl Hit for Sphere {
    fn hit(&self, ray: &Ray, t_min: f64, t_max: f64) -> Option<RayHit> {
        // solve quadratic equation
        let oc = ray.origin() - self.center;

        let a = ray.direction().squared_length();
        let half_b = oc.dot(&ray.direction());
        let c = oc.squared_length() - self.radius * self.radius;
        let discriminant = half_b * half_b - a * c;

        // no solutions, so escape early
        if discriminant < 0.0 {
            return None;
        }

        // find closest root solution within t_min and t_max
        let disc_sqrt = discriminant.sqrt();
        let mut root = (-half_b - disc_sqrt) / a;
        if root <= t_min || root >= t_max {
            root = (-half_b + disc_sqrt) / a;
            if root <= t_min || root >= t_max {
                return None;
            }
        }

        Some(RayHit {
            t: root,
            point: ray.at(root),
            normal: (ray.at(root) - self.center) / self.radius,
        })
    }
}
