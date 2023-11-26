use std::rc::Rc;

use crate::{
    geometry::{Intersect, Point, Ray, RayHit, Vector},
    shading::materials::Scatter,
    utils::Interval,
};

use super::AABB;

#[derive(Clone)]
pub struct Sphere {
    center_1: Point,
    // center_2: Option<Point>,
    center_vector: Option<Vector>,
    radius: f64,
    material: Rc<dyn Scatter>,
    bounding_box: AABB,
}

impl Sphere {
    pub fn new(center: Point, radius: f64, material: Rc<dyn Scatter>) -> Self {
        let radius_vector = Vector::new(radius, radius, radius);
        Self {
            center_1: center,
            center_vector: None,
            radius,
            material: Rc::clone(&material),
            bounding_box: AABB::from_points(center - radius_vector, center + radius_vector),
        }
    }

    pub fn new_in_motion(
        center_1: Point,
        center_2: Point,
        radius: f64,
        material: Rc<dyn Scatter>,
    ) -> Self {
        let radius_vector = Vector::new(radius, radius, radius);
        let bounding_box_1 = AABB::from_points(center_1 - radius_vector, center_1 + radius_vector);
        let bounding_box_2 = AABB::from_points(center_2 - radius_vector, center_2 + radius_vector);
        Self {
            center_1,
            center_vector: Some(center_1.to(&center_2)),
            radius,
            material,
            bounding_box: AABB::from_aabbs(bounding_box_1, bounding_box_2),
        }
    }

    pub fn center(&self, time: f64) -> Point {
        match self.center_vector {
            Some(center_vector) => self.center_1 + time * center_vector,
            None => self.center_1,
        }
    }
}

impl Intersect for Sphere {
    fn intersect(&self, ray: &Ray, ray_t: Interval) -> Option<RayHit> {
        let center = self.center(ray.time);

        // solve quadratic equation
        let oc = ray.origin - center;

        let a = ray.direction.squared_length();
        let half_b = oc.dot(&ray.direction);
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
            normal: (ray.at(root) - center) / self.radius,
            material: Rc::clone(&self.material),
        })
    }

    fn bounding_box(&self) -> AABB {
        self.bounding_box
    }
}
