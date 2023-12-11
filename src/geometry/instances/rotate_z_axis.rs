use std::sync::Arc;

use crate::{
    geometry::{Geometric, Point, Ray, RayHit, Vector, AABB},
    utils::{Angle, Interval},
};

#[derive(Clone)]
pub struct RotateZAxis {
    geometric: Arc<dyn Geometric>,
    translation: Vector,
    sin_theta: f64,
    cos_theta: f64,
    bounding_box: AABB,
}

impl RotateZAxis {
    pub fn new(geometric: Arc<dyn Geometric>, angle: Angle, around: Point) -> Self {
        let translation = around.0;
        let geometric_bbox = geometric.bounding_box() - translation;

        let sin_theta = angle.as_radians().sin();
        let cos_theta = angle.as_radians().cos();

        let mut min_extent = Point::new(f64::INFINITY, f64::INFINITY, f64::INFINITY);
        let mut max_extent = Point::new(f64::NEG_INFINITY, f64::NEG_INFINITY, f64::NEG_INFINITY);

        for i in 0..2 {
            for j in 0..2 {
                for k in 0..2 {
                    // grab one of the four corners of the bounding box
                    let x = i as f64 * geometric_bbox.x_interval.maximum
                        + (1 - i) as f64 * geometric_bbox.x_interval.minimum;
                    let y = j as f64 * geometric_bbox.y_interval.maximum
                        + (1 - j) as f64 * geometric_bbox.y_interval.minimum;
                    let z = k as f64 * geometric_bbox.z_interval.maximum
                        + (1 - k) as f64 * geometric_bbox.z_interval.minimum;

                    // rotate it
                    let new_x = x * cos_theta - y * sin_theta;
                    let new_y = x * sin_theta + y * cos_theta;

                    let rotated_point = Point::new(new_x, new_y, z);

                    min_extent = min_extent.min_components_point(rotated_point);
                    max_extent = max_extent.max_components_point(rotated_point);
                }
            }
        }

        Self {
            geometric: Arc::clone(&geometric),
            translation,
            sin_theta,
            cos_theta,
            bounding_box: AABB::from_points(&[min_extent, max_extent]) + translation,
        }
    }

    fn world_to_local_point(&self, v: Point) -> Point {
        Point::from_vector(self.world_to_local_vector(v.0 - self.translation)) + self.translation
    }

    fn world_to_local_vector(&self, v: Vector) -> Vector {
        let x = self.cos_theta * v.x + self.sin_theta * v.y;
        let y = -self.sin_theta * v.x + self.cos_theta * v.y;

        Vector::new(x, y, v.z)
    }

    fn local_to_world_point(&self, v: Point) -> Point {
        Point::from_vector(self.local_to_world_vector(v.0 - self.translation)) + self.translation
    }

    fn local_to_world_vector(&self, v: Vector) -> Vector {
        let x = self.cos_theta * v.x - self.sin_theta * v.y;
        let y = self.sin_theta * v.x + self.cos_theta * v.y;

        Vector::new(x, y, v.z)
    }
}

impl Geometric for RotateZAxis {
    fn intersect(&self, ray: Ray, ray_t: Interval) -> Option<RayHit> {
        // change the ray from world coordinates to object coordinates
        let mut local_ray = ray;
        local_ray.origin = self.world_to_local_point(local_ray.origin);
        local_ray.direction = self.world_to_local_vector(local_ray.direction);

        // check intersection in object coordinates
        let mut rayhit = match self.geometric.intersect(local_ray, ray_t) {
            Some(rayhit) => rayhit,
            None => return None,
        };

        // change the ray back to world coordinates
        rayhit.point = self.local_to_world_point(rayhit.point);
        rayhit.normal = self.local_to_world_vector(rayhit.normal);

        Some(rayhit)
    }

    fn bounding_box(&self) -> AABB {
        self.bounding_box
    }
}
