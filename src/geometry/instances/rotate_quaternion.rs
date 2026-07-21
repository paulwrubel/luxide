use std::sync::Arc;

use crate::{
    geometry::{Aabb, Geometric, Matrix3, Point, Ray, RayHit, Vector3},
    utils::{Around, Interval},
};

#[derive(Clone, Debug)]
pub struct RotateQuaternion {
    geometric: Arc<dyn Geometric>,
    translation: Vector3,
    rotation: Matrix3,
    inv_rotation: Matrix3,
    bounding_box: Aabb,
}

impl RotateQuaternion {
    pub fn new(geometric: Arc<dyn Geometric>, quaternion: [f64; 4], around: Around) -> Self {
        let translation = around.point(&geometric).0;

        // normalize the quaternion; fall back to identity if degenerate
        let [w, x, y, z] = quaternion;
        let len_sq = w * w + x * x + y * y + z * z;
        let (w, x, y, z) = if len_sq <= 0.0 {
            (1.0, 0.0, 0.0, 0.0)
        } else {
            let inv_len = 1.0 / len_sq.sqrt();
            (w * inv_len, x * inv_len, y * inv_len, z * inv_len)
        };

        let rotation = Matrix3::from_quaternion(w, x, y, z);
        let inv_rotation = rotation.transpose();

        let child_bbox = geometric.bounding_box();
        let bounding_box = if child_bbox.is_infinite() {
            // a rotated unbounded volume is still unbounded; a finite AABB can't
            // represent it (and rotating infinite corners yields NaN), so mark it
            // UNIVERSE to route it to the scene's unbounded list.
            Aabb::UNIVERSE
        } else {
            let geometric_bbox = child_bbox - translation;

            let mut min_extent = Point::new(f64::INFINITY, f64::INFINITY, f64::INFINITY);
            let mut max_extent =
                Point::new(f64::NEG_INFINITY, f64::NEG_INFINITY, f64::NEG_INFINITY);

            for i in 0..2 {
                for j in 0..2 {
                    for k in 0..2 {
                        // grab one of the eight corners of the bounding box
                        let x = i as f64 * geometric_bbox.x_interval.maximum
                            + (1 - i) as f64 * geometric_bbox.x_interval.minimum;
                        let y = j as f64 * geometric_bbox.y_interval.maximum
                            + (1 - j) as f64 * geometric_bbox.y_interval.minimum;
                        let z = k as f64 * geometric_bbox.z_interval.maximum
                            + (1 - k) as f64 * geometric_bbox.z_interval.minimum;

                        // rotate it
                        let rotated = rotation * Vector3::new(x, y, z);
                        let rotated_point = Point::new(rotated.x, rotated.y, rotated.z);

                        min_extent = min_extent.min_components_point(rotated_point);
                        max_extent = max_extent.max_components_point(rotated_point);
                    }
                }
            }

            Aabb::from_points(&[min_extent, max_extent]) + translation
        };

        Self {
            geometric: Arc::clone(&geometric),
            translation,
            rotation,
            inv_rotation,
            bounding_box,
        }
    }

    fn world_to_local_point(&self, v: Point) -> Point {
        Point::from_vector3(self.world_to_local_vector(v.0 - self.translation)) + self.translation
    }

    fn world_to_local_vector(&self, v: Vector3) -> Vector3 {
        self.inv_rotation * v
    }

    fn local_to_world_point(&self, v: Point) -> Point {
        Point::from_vector3(self.local_to_world_vector(v.0 - self.translation)) + self.translation
    }

    fn local_to_world_vector(&self, v: Vector3) -> Vector3 {
        self.rotation * v
    }
}

impl Geometric for RotateQuaternion {
    fn intersect(&self, ray: Ray, ray_t: Interval) -> Option<RayHit> {
        // change the ray from world coordinates to object coordinates
        let mut local_ray = ray;
        local_ray.origin = self.world_to_local_point(local_ray.origin);
        local_ray.direction = self.world_to_local_vector(local_ray.direction);

        // check intersection in object coordinates
        let mut rayhit = self.geometric.intersect(local_ray, ray_t)?;

        // change the ray back to world coordinates
        rayhit.point = self.local_to_world_point(rayhit.point);
        rayhit.normal = self.local_to_world_vector(rayhit.normal);

        Some(rayhit)
    }

    fn surface_area(&self) -> f64 {
        self.geometric.surface_area()
    }

    fn is_emissive(&self) -> bool {
        self.geometric.is_emissive()
    }

    fn is_transmissive(&self) -> bool {
        self.geometric.is_transmissive()
    }

    fn is_specular(&self) -> bool {
        self.geometric.is_specular()
    }

    fn is_empty(&self) -> bool {
        self.geometric.is_empty()
    }

    fn bounding_box(&self) -> Aabb {
        self.bounding_box
    }

    fn sample_direction_from(&self, origin: Point) -> Vector3 {
        let local_origin = self.world_to_local_point(origin);
        let local_dir = self.geometric.sample_direction_from(local_origin);
        self.local_to_world_vector(local_dir)
    }

    fn direction_pdf(&self, origin: Point, dir: Vector3) -> f64 {
        let local_origin = self.world_to_local_point(origin);
        let local_dir = self.world_to_local_vector(dir);
        // PDF is invariant under rigid transforms
        self.geometric.direction_pdf(local_origin, local_dir)
    }
}
