use std::sync::Arc;

use crate::{
    geometry::{Aabb, Geometric, Point, Ray, RayHit, Vector3},
    utils::{Around, Interval},
};

#[derive(Clone, Debug)]
pub struct Scale {
    geometric: Arc<dyn Geometric>,
    translation: Vector3,
    scale: Vector3,
    inv_scale: Vector3,
    bounding_box: Aabb,
}

impl Scale {
    pub fn new(
        geometric: Arc<dyn Geometric>,
        scale: Vector3,
        around: Around,
    ) -> Result<Self, String> {
        if scale.x == 0.0 || scale.y == 0.0 || scale.z == 0.0 {
            return Err("scale factors must be non-zero in all axes".to_string());
        }

        let inv_scale = Vector3::new(1.0 / scale.x, 1.0 / scale.y, 1.0 / scale.z);
        let translation = around.point(&geometric).0;

        let geometric_bbox = geometric.bounding_box() - translation;

        let mut min_extent = Point::INFINITY;
        let mut max_extent = -Point::INFINITY;

        for i in 0..2 {
            for j in 0..2 {
                for k in 0..2 {
                    let x = i as f64 * geometric_bbox.x_interval.maximum
                        + (1 - i) as f64 * geometric_bbox.x_interval.minimum;
                    let y = j as f64 * geometric_bbox.y_interval.maximum
                        + (1 - j) as f64 * geometric_bbox.y_interval.minimum;
                    let z = k as f64 * geometric_bbox.z_interval.maximum
                        + (1 - k) as f64 * geometric_bbox.z_interval.minimum;

                    let corner = Point::new(x, y, z);
                    let scaled_corner = Point::from_vector3(corner.0 * scale);

                    min_extent = min_extent.min_components_point(scaled_corner);
                    max_extent = max_extent.max_components_point(scaled_corner);
                }
            }
        }

        Ok(Self {
            geometric: Arc::clone(&geometric),
            translation,
            scale,
            inv_scale,
            bounding_box: Aabb::from_points(&[min_extent, max_extent]) + translation,
        })
    }
}

impl Geometric for Scale {
    fn intersect(&self, ray: Ray, ray_t: Interval) -> Option<RayHit> {
        // transform ray from world space to local (unscaled) space
        let local_origin = Point::from_vector3((ray.origin.0 - self.translation) / self.scale);
        let local_direction = ray.direction / self.scale;
        let local_ray = Ray::new(local_origin, local_direction, ray.time);

        self.geometric.intersect(local_ray, ray_t).map(|mut rh| {
            // transform hit point to world space
            rh.point.0 = rh.point.0 * self.scale + self.translation;
            // transform normal via inverse-transpose
            rh.normal = (rh.normal * self.inv_scale).unit_vector();
            rh
        })
    }

    fn surface_area(&self) -> f64 {
        let sx = self.scale.x.abs();
        let sy = self.scale.y.abs();
        let sz = self.scale.z.abs();
        self.geometric.surface_area() * (sy * sz + sx * sz + sx * sy) / 3.0
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
        let local_origin = Point::from_vector3((origin.0 - self.translation) / self.scale);
        let local_dir = self.geometric.sample_direction_from(local_origin);
        (local_dir * self.scale).unit_vector()
    }

    fn direction_pdf(&self, origin: Point, dir: Vector3) -> f64 {
        let local_origin = Point::from_vector3((origin.0 - self.translation) / self.scale);
        let local_dir = (dir / self.scale).unit_vector();

        let p_local = self.geometric.direction_pdf(local_origin, local_dir);

        // solid-angle Jacobian for the direction map ω → normalize(scale * ω):
        // p_world = p_local / |J|  where  |J| = |det(S)| / |S·ω_local|³
        let a_sq = self.scale.x * self.scale.x * local_dir.x * local_dir.x
            + self.scale.y * self.scale.y * local_dir.y * local_dir.y
            + self.scale.z * self.scale.z * local_dir.z * local_dir.z;
        let det = self.scale.x.abs() * self.scale.y.abs() * self.scale.z.abs();
        let jacobian = det / (a_sq * a_sq.sqrt());

        p_local / jacobian
    }
}
