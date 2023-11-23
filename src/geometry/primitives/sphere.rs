use std::rc::Rc;

use crate::{
    geometry::{Point, Ray},
    shading::materials::Scatter,
    utils::Interval,
};

use super::{Hit, RayHit};

#[derive(Clone)]
pub struct Sphere {
    center: Point,
    radius: f64,
    material: Rc<dyn Scatter>,
}

impl Sphere {
    pub fn new(center: Point, radius: f64, material: Rc<dyn Scatter>) -> Self {
        Self {
            center,
            radius,
            material: Rc::clone(&material),
        }
    }
}

impl Hit for Sphere {
    fn hit(&self, ray: &Ray, ray_t: Interval) -> Option<RayHit> {
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
        if !ray_t.contains_excluding(root) {
            root = (-half_b + disc_sqrt) / a;
            if !ray_t.contains_excluding(root) {
                return None;
            }
        }

        Some(RayHit {
            t: root,
            point: ray.at(root),
            normal: (ray.at(root) - self.center) / self.radius,
            material: Rc::clone(&self.material),
        })
    }
}
