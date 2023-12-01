use crate::{
    geometry::{primitives::AABB, Intersect, Point, Ray, RayHit, Vector},
    utils::{Angle, Interval},
};

#[derive(Clone)]
pub struct RotateYAxis {
    primitive: Box<dyn Intersect>,
    translation: Vector,
    sin_theta: f64,
    cos_theta: f64,
    bounding_box: AABB,
}

impl RotateYAxis {
    pub fn new(primitive: Box<dyn Intersect>, angle: Angle, around: Point) -> Self {
        let translation = around.0;
        let primitive_bbox = primitive.bounding_box() - translation;

        let sin_theta = angle.as_radians().sin();
        let cos_theta = angle.as_radians().cos();

        let mut min_extent = Point::new(f64::INFINITY, f64::INFINITY, f64::INFINITY);
        let mut max_extent = Point::new(f64::NEG_INFINITY, f64::NEG_INFINITY, f64::NEG_INFINITY);

        for i in 0..2 {
            for j in 0..2 {
                for k in 0..2 {
                    // grab one of the four corners of the bounding box
                    let x = i as f64 * primitive_bbox.x_interval.maximum
                        + (1 - i) as f64 * primitive_bbox.x_interval.minimum;
                    let y = j as f64 * primitive_bbox.y_interval.maximum
                        + (1 - j) as f64 * primitive_bbox.y_interval.minimum;
                    let z = k as f64 * primitive_bbox.z_interval.maximum
                        + (1 - k) as f64 * primitive_bbox.z_interval.minimum;

                    // rotate it
                    let new_x = x * cos_theta + z * sin_theta;
                    let new_z = -x * sin_theta + z * cos_theta;

                    let rotated_point = Point::new(new_x, y, new_z);

                    min_extent = min_extent.min_components_point(rotated_point);
                    max_extent = max_extent.max_components_point(rotated_point);
                }
            }
        }

        Self {
            primitive,
            translation,
            sin_theta,
            cos_theta,
            bounding_box: AABB::from_points(min_extent, max_extent) + translation,
        }
    }

    fn world_to_local(&self, v: Vector) -> Vector {
        let v = v - self.translation;

        let x = self.cos_theta * v.x - self.sin_theta * v.z;
        let z = self.sin_theta * v.x + self.cos_theta * v.z;

        Vector::new(x, v.y, z)
    }

    fn local_to_world(&self, v: Vector) -> Vector {
        let x = self.cos_theta * v.x + self.sin_theta * v.z;
        let z = -self.sin_theta * v.x + self.cos_theta * v.z;

        let v = Vector::new(x, v.y, z);

        v + self.translation
    }
}

impl Intersect for RotateYAxis {
    fn intersect(&self, ray: Ray, ray_t: Interval) -> Option<RayHit> {
        // change the ray from world coordinates to object coordinates
        let mut local_ray = ray;
        local_ray.origin.0 = self.world_to_local(local_ray.origin.0);
        local_ray.direction = self.world_to_local(local_ray.direction);

        // check intersection in object coordinates
        let mut rayhit = match self.primitive.intersect(local_ray, ray_t) {
            Some(rayhit) => rayhit,
            None => return None,
        };

        // change the ray back to world coordinates
        rayhit.point.0 = self.local_to_world(rayhit.point.0);
        rayhit.normal = self.local_to_world(rayhit.normal);

        Some(rayhit)
    }

    fn bounding_box(&self) -> AABB {
        self.bounding_box
    }
}
