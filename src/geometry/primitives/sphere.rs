use std::{f64::consts::PI, sync::Arc};

use crate::{
    geometry::{Geometric, Point, Ray, RayHit, Vector, AABB},
    shading::materials::{Lambertian, Material},
    utils::Interval,
};

#[derive(Clone)]
pub struct Sphere {
    center_1: Point,
    center_vector: Option<Vector>,
    radius: f64,
    material: Arc<dyn Material>,
    bounding_box: AABB,
}

impl Sphere {
    pub fn new(center: Point, radius: f64, material: Arc<dyn Material>) -> Self {
        let radius_vector = Vector::new(radius, radius, radius);
        Self {
            center_1: center,
            center_vector: None,
            radius,
            material: Arc::clone(&material),
            bounding_box: AABB::from_points(&[center - radius_vector, center + radius_vector]),
        }
    }

    pub fn new_in_motion(
        center_1: Point,
        center_2: Point,
        radius: f64,
        material: Arc<dyn Material>,
    ) -> Self {
        let radius_vector = Vector::new(radius, radius, radius);
        let bounding_box_1 =
            AABB::from_points(&[center_1 - radius_vector, center_1 + radius_vector]);
        let bounding_box_2 =
            AABB::from_points(&[center_2 - radius_vector, center_2 + radius_vector]);
        Self {
            center_1,
            center_vector: Some(center_1.to(center_2)),
            radius,
            material,
            bounding_box: AABB::from_aabbs(bounding_box_1, bounding_box_2),
        }
    }

    pub fn unit() -> Self {
        Self::new(
            Point::new(0.0, 0.0, 0.0),
            1.0,
            Arc::new(Lambertian::white()),
        )
    }

    pub fn center(&self, time: f64) -> Point {
        match self.center_vector {
            Some(center_vector) => self.center_1 + time * center_vector,
            None => self.center_1,
        }
    }

    fn uv(unit_point: Point) -> (f64, f64) {
        let theta = (-unit_point.0.y).acos();
        let phi = (-unit_point.0.z).atan2(unit_point.0.x) + PI;

        let u = phi / (2.0 * PI);
        let v = theta / PI;

        (u, v)
    }
}

impl Geometric for Sphere {
    fn intersect(&self, ray: Ray, ray_t: Interval) -> Option<RayHit> {
        let center = self.center(ray.time);

        // solve quadratic equation
        let oc = ray.origin - center;

        let a = ray.direction.squared_length();
        let half_b = oc.dot(ray.direction);
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

        let point = ray.at(root);
        let (u, v) = Self::uv(Point::from_vector(center.to(point).unit_vector()));

        Some(RayHit {
            t: root,
            point,
            normal: (ray.at(root) - center) / self.radius,
            material: Arc::clone(&self.material),
            u,
            v,
        })
    }

    fn bounding_box(&self) -> AABB {
        self.bounding_box
    }
}
