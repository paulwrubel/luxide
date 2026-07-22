use std::f64::consts::{PI, TAU};
use std::sync::Arc;

use crate::{
    geometry::{Aabb, Geometric, Onb, Point, Ray, RayHit, Vector3},
    shading::materials::{Lambertian, Material},
    utils::Interval,
};

#[derive(Clone, Debug)]
pub struct Disk {
    center: Point,
    radius: f64,
    inner_radius: f64,
    plane_d: f64,
    onb: Onb,
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
        material: Arc<dyn Material>,
    ) -> Result<Self, String> {
        if normal.squared_length() <= 0.0 {
            return Err("disk normal must not be zero-length".to_string());
        }
        let onb = Onb::from_w(normal.unit_vector());
        Self::new_with_onb(center, radius, inner_radius, material, onb)
    }

    /// Construct a disk with an explicit orthonormal tangent frame `onb`
    /// (`onb.w` is the surface normal, `onb.u`/`onb.v` span the disk plane and
    /// determine the UV orientation). Used when the caller needs the disk's
    /// texture axes aligned to an external convention rather than the default
    /// frame derived from the normal.
    #[allow(clippy::too_many_arguments)]
    pub fn new_with_onb(
        center: Point,
        radius: f64,
        inner_radius: f64,
        material: Arc<dyn Material>,
        onb: Onb,
    ) -> Result<Self, String> {
        if radius <= 0.0 {
            return Err("disk radius must be positive".to_string());
        }
        if inner_radius < 0.0 || inner_radius >= radius {
            return Err("disk inner_radius must be in [0, radius)".to_string());
        }

        let plane_d = center.0.dot(onb.w);

        // area of the annular disk
        let area = PI * (radius.powi(2) - inner_radius.powi(2));

        // bounding box: for each axis, compute the half-extent as the
        // maximum projection of the disk's tangent vectors
        let ex = ((onb.u.x * radius).powi(2) + (onb.v.x * radius).powi(2)).sqrt();
        let ey = ((onb.u.y * radius).powi(2) + (onb.v.y * radius).powi(2)).sqrt();
        let ez = ((onb.u.z * radius).powi(2) + (onb.v.z * radius).powi(2)).sqrt();
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
            radius,
            inner_radius,
            plane_d,
            onb,
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
            Arc::new(Lambertian::white()),
        )
        .expect("unit disk parameters are valid")
    }
}

impl Geometric for Disk {
    fn intersect(&self, ray: Ray, ray_t: Interval) -> Option<RayHit> {
        let denominator = self.onb.w.dot(ray.direction);

        // parallel ray — no intersection
        if denominator.abs() < 1e-8 {
            return None;
        }

        let t = (self.plane_d - self.onb.w.dot(ray.origin.0)) / denominator;
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

        // uv mapping via cartesian projection
        //
        // projects the hit point onto the disk's tangent axes, then normalizes
        // by outer radius to get [-1, 1] and maps to [0, 1].
        let hit_local = hit_point.0 - self.center.0;
        let u = (hit_local.dot(self.onb.u) / self.radius + 1.0) / 2.0;
        let v = (hit_local.dot(self.onb.v) / self.radius + 1.0) / 2.0;

        Some(RayHit {
            t,
            point: hit_point,
            normal: self.onb.w,
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
        let p = self.center + r * phi.cos() * self.onb.u + r * phi.sin() * self.onb.v;
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
        assert_eq!(hit.u, 0.5);
        assert_eq!(hit.v, 0.5);
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
    fn hits_back() {
        let d = Disk::new(
            Point::new(0.0, 0.0, 0.0),
            Vector3::new(0.0, 0.0, 1.0),
            1.0,
            0.0,
            Arc::new(Lambertian::white()),
        )
        .unwrap();

        let ray = Ray::new(Point::new(0.0, 0.0, -1.0), Vector3::new(0.0, 0.0, 1.0), 0.0);
        let ray_t = Interval::new(0.0, f64::INFINITY);

        let opt_hit = d.intersect(ray, ray_t);
        assert!(opt_hit.is_some());
        let hit = opt_hit.unwrap();

        assert_eq!(hit.normal, Vector3::new(0.0, 0.0, 1.0));
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
