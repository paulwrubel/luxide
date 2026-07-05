use std::f64::consts::{PI, TAU};
use std::sync::Arc;

use crate::{
    geometry::{Aabb, Geometric, Point, Ray, RayHit, Vector3},
    shading::materials::{Lambertian, Material},
    utils::Interval,
};

#[derive(Clone, Debug)]
pub struct Disk {
    center: Point,
    normal: Vector3,
    radius: f64,
    inner_radius: f64,
    is_culled: bool,
    plane_d: f64,
    u_axis: Vector3,
    v_axis: Vector3,
    material: Arc<dyn Material>,
    bounding_box: Aabb,
    area: f64,
}

impl Disk {
    #[allow(clippy::too_many_arguments)]
    pub fn new(
        center: Point,
        normal: Vector3,
        radius: f64,
        inner_radius: f64,
        is_culled: bool,
        material: Arc<dyn Material>,
    ) -> Result<Self, String> {
        if radius <= 0.0 {
            return Err("disk radius must be positive".to_string());
        }
        if inner_radius < 0.0 || inner_radius >= radius {
            return Err("disk inner_radius must be in [0, radius)".to_string());
        }
        if normal.squared_length() <= 0.0 {
            return Err("disk normal must not be zero-length".to_string());
        }
        let normal = normal.unit_vector();

        // tangent basis
        let reference = if normal.y.abs() < 0.999 {
            Vector3::new(0.0, 1.0, 0.0)
        } else {
            Vector3::new(1.0, 0.0, 0.0)
        };
        let u_axis = reference.cross(normal).unit_vector();
        let v_axis = normal.cross(u_axis);

        let plane_d = center.0.dot(normal);

        // area of the annular disk
        let area = PI * (radius.powi(2) - inner_radius.powi(2));

        // bounding box: for each axis, compute the half-extent as the
        // maximum projection of the disk's tangent vectors
        let ex = ((u_axis.x * radius).powi(2) + (v_axis.x * radius).powi(2)).sqrt();
        let ey = ((u_axis.y * radius).powi(2) + (v_axis.y * radius).powi(2)).sqrt();
        let ez = ((u_axis.z * radius).powi(2) + (v_axis.z * radius).powi(2)).sqrt();
        let points = [
            center + Vector3::new(-ex, -ey, -ez),
            center + Vector3::new(-ex, -ey, ez),
            center + Vector3::new(-ex, ey, -ez),
            center + Vector3::new(-ex, ey, ez),
            center + Vector3::new(ex, -ey, -ez),
            center + Vector3::new(ex, -ey, ez),
            center + Vector3::new(ex, ey, -ez),
            center + Vector3::new(ex, ey, ez),
        ];

        Ok(Self {
            center,
            normal,
            radius,
            inner_radius,
            is_culled,
            plane_d,
            u_axis,
            v_axis,
            material,
            bounding_box: Aabb::from_points(&points).pad(0.0001),
            area,
        })
    }

    pub fn unit() -> Self {
        Self::new(
            Point::new(0.0, 0.0, 0.0),
            Vector3::new(0.0, 0.0, 1.0),
            1.0,
            0.0,
            true,
            Arc::new(Lambertian::white()),
        )
        .expect("unit disk parameters are valid")
    }
}

impl Geometric for Disk {
    fn intersect(&self, ray: Ray, ray_t: Interval) -> Option<RayHit> {
        let denominator = self.normal.dot(ray.direction);

        // parallel ray — no intersection
        if denominator.abs() < 1e-8 {
            return None;
        }

        // back-face culling
        if self.is_culled && denominator >= -1e-8 {
            return None;
        }

        let t = (self.plane_d - self.normal.dot(ray.origin.0)) / denominator;
        if !ray_t.contains_including(t) {
            return None;
        }

        let hit_point = ray.at(t);
        let diff = hit_point - self.center;
        let d_sq = diff.squared_length();

        // radial containment (squared, no sqrt)
        if d_sq < self.inner_radius.powi(2) || d_sq > self.radius.powi(2) {
            return None;
        }

        // UV mapping
        let hit_local = hit_point.0 - self.center.0;
        let phi = hit_local.dot(self.v_axis).atan2(hit_local.dot(self.u_axis));
        let phi_wrapped = if phi < 0.0 { phi + TAU } else { phi };
        let u = phi_wrapped / TAU;
        let d = d_sq.sqrt();
        let v = (self.radius - d) / (self.radius - self.inner_radius);

        // invert the normal if we are not culled and the ray hits the back side
        let local_normal = if !self.is_culled && denominator > 0.0 {
            -self.normal
        } else {
            self.normal
        };

        Some(RayHit {
            t,
            point: hit_point,
            normal: local_normal,
            material: Arc::clone(&self.material),
            u,
            v,
        })
    }

    fn surface_area(&self) -> f64 {
        self.area
    }

    fn is_emissive(&self) -> bool {
        self.material.is_emissive()
    }

    fn is_transmissive(&self) -> bool {
        self.material.is_transmissive()
    }

    fn is_specular(&self) -> bool {
        self.material.is_specular()
    }

    fn is_empty(&self) -> bool {
        self.surface_area() <= 0.0
    }

    fn bounding_box(&self) -> Aabb {
        self.bounding_box
    }

    fn sample_direction_from(&self, origin: Point) -> Vector3 {
        // uniform area sampling on a disk: sample r² uniformly in
        // [inner_radius², radius²] and φ uniformly in [0, 2π].
        // the sqrt correction (r = sqrt(r²)) ensures uniform area
        // distribution — without it, the center would get over-sampled.
        // when inner_radius == 0 this is equivalent to Malley's method
        // used by Vector3::random_cosine_weighted_direction.
        let r_sq: f64 = rand::random::<f64>() * (self.radius.powi(2) - self.inner_radius.powi(2))
            + self.inner_radius.powi(2);
        let r = r_sq.sqrt();
        let phi: f64 = rand::random::<f64>() * TAU;
        let p = self.center + r * phi.cos() * self.u_axis + r * phi.sin() * self.v_axis;
        origin.to(p).unit_vector()
    }

    fn direction_pdf(&self, origin: Point, direction: Vector3) -> f64 {
        let ray = Ray::new(origin, direction, 0.0);

        let Some(hit) = self.intersect(ray, Interval::new(0.001, f64::INFINITY)) else {
            return 0.0;
        };

        let cos_theta = direction.dot(hit.normal).abs();
        if cos_theta < 1e-8 {
            return 0.0;
        }

        (hit.t * hit.t) / (cos_theta * self.area)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn hits_front_center() {
        let d = Disk::unit();

        let ray = Ray::new(Point::new(0.0, 0.0, 1.0), Vector3::new(0.0, 0.0, -1.0), 0.0);
        let ray_t = Interval::new(0.0, f64::INFINITY);

        let opt_hit = d.intersect(ray, ray_t);
        assert!(opt_hit.is_some());
        let hit = opt_hit.unwrap();

        assert_eq!(hit.normal, Vector3::new(0.0, 0.0, 1.0));
        assert_eq!(hit.point, Point::new(0.0, 0.0, 0.0));
        assert_eq!(hit.t, 1.0);
        assert_eq!(hit.v, 1.0);
    }

    #[test]
    fn hits_front_edge() {
        let d = Disk::unit();

        let ray = Ray::new(Point::new(1.0, 0.0, 1.0), Vector3::new(0.0, 0.0, -1.0), 0.0);
        let ray_t = Interval::new(0.0, f64::INFINITY);

        let opt_hit = d.intersect(ray, ray_t);
        assert!(opt_hit.is_some());
        let hit = opt_hit.unwrap();

        assert_eq!(hit.normal, Vector3::new(0.0, 0.0, 1.0));
        assert_eq!(hit.point, Point::new(1.0, 0.0, 0.0));
        assert_eq!(hit.t, 1.0);
    }

    #[test]
    fn misses_outside_radius() {
        let d = Disk::unit();

        let ray = Ray::new(Point::new(2.0, 0.0, 1.0), Vector3::new(0.0, 0.0, -1.0), 0.0);
        let ray_t = Interval::new(0.0, f64::INFINITY);

        let opt_hit = d.intersect(ray, ray_t);
        assert!(opt_hit.is_none());
    }

    #[test]
    fn misses_culled_back() {
        let d = Disk::unit();

        let ray = Ray::new(Point::new(0.0, 0.0, -1.0), Vector3::new(0.0, 0.0, 1.0), 0.0);
        let ray_t = Interval::new(0.0, f64::INFINITY);

        let opt_hit = d.intersect(ray, ray_t);
        assert!(opt_hit.is_none());
    }

    #[test]
    fn hits_unculled_back() {
        let d = Disk::new(
            Point::new(0.0, 0.0, 0.0),
            Vector3::new(0.0, 0.0, 1.0),
            1.0,
            0.0,
            false,
            Arc::new(Lambertian::white()),
        )
        .unwrap();

        let ray = Ray::new(Point::new(0.0, 0.0, -1.0), Vector3::new(0.0, 0.0, 1.0), 0.0);
        let ray_t = Interval::new(0.0, f64::INFINITY);

        let opt_hit = d.intersect(ray, ray_t);
        assert!(opt_hit.is_some());
        let hit = opt_hit.unwrap();

        assert_eq!(hit.normal, Vector3::new(0.0, 0.0, -1.0));
        assert_eq!(hit.point, Point::new(0.0, 0.0, 0.0));
        assert_eq!(hit.t, 1.0);
    }

    #[test]
    fn parallel_ray_misses() {
        let d = Disk::unit();

        let ray = Ray::new(Point::new(0.0, 0.0, 1.0), Vector3::new(1.0, 0.0, 0.0), 0.0);
        let ray_t = Interval::new(0.0, f64::INFINITY);

        let opt_hit = d.intersect(ray, ray_t);
        assert!(opt_hit.is_none());
    }

    #[test]
    fn hits_annulus_inner() {
        let d = Disk::new(
            Point::new(0.0, 0.0, 0.0),
            Vector3::new(0.0, 0.0, 1.0),
            1.0,
            0.5,
            true,
            Arc::new(Lambertian::white()),
        )
        .unwrap();

        let ray = Ray::new(
            Point::new(0.75, 0.0, 1.0),
            Vector3::new(0.0, 0.0, -1.0),
            0.0,
        );
        let ray_t = Interval::new(0.0, f64::INFINITY);

        let opt_hit = d.intersect(ray, ray_t);
        assert!(opt_hit.is_some());
        let hit = opt_hit.unwrap();

        assert_eq!(hit.point, Point::new(0.75, 0.0, 0.0));
        assert_eq!(hit.t, 1.0);
    }

    #[test]
    fn misses_annulus_hole() {
        let d = Disk::new(
            Point::new(0.0, 0.0, 0.0),
            Vector3::new(0.0, 0.0, 1.0),
            1.0,
            0.5,
            true,
            Arc::new(Lambertian::white()),
        )
        .unwrap();

        let ray = Ray::new(
            Point::new(0.25, 0.0, 1.0),
            Vector3::new(0.0, 0.0, -1.0),
            0.0,
        );
        let ray_t = Interval::new(0.0, f64::INFINITY);

        let opt_hit = d.intersect(ray, ray_t);
        assert!(opt_hit.is_none());
    }
}
