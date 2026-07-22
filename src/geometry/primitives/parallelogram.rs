use std::sync::Arc;

use crate::{
    geometry::{Aabb, Geometric, Point, Ray, RayHit, Vector3},
    shading::materials::{Lambertian, Material},
    utils::Interval,
};

#[derive(Clone, Debug)]
pub struct Parallelogram {
    lower_left: Point,
    u: Vector3,
    v: Vector3,
    normal: Vector3,
    plane_d: f64,
    w: Vector3,
    material: Arc<dyn Material>,
    bounding_box: Aabb,
    area: f64, // cache this because it's used quite often in sampling
}

impl Parallelogram {
    pub fn new(lower_left: Point, u: Vector3, v: Vector3, material: Arc<dyn Material>) -> Self {
        let n = u.cross(v);
        let normal = n.unit_vector();
        Self {
            lower_left,
            u,
            v,
            normal,
            plane_d: lower_left.0.dot(normal),
            w: n / n.dot(n),
            material,
            bounding_box: Aabb::from_points(&[lower_left, lower_left + u + v]).pad(0.0001),
            area: u.cross(v).length(),
        }
    }

    pub fn unit() -> Self {
        Self::new(
            Point::new(-0.5, -0.5, 0.0),
            Vector3::new(1.0, 0.0, 0.0),
            Vector3::new(0.0, 1.0, 0.0),
            Arc::new(Lambertian::white()),
        )
    }
}

impl Geometric for Parallelogram {
    fn intersect(&self, ray: Ray, ray_t: Interval) -> Option<RayHit> {
        let denominator = self.normal.dot(ray.direction);

        if denominator.abs() <= 1e-8 {
            // if the ray is parallel to the plane, then there is no intersection
            return None;
        }

        let t = (self.plane_d - self.normal.dot(ray.origin.0)) / denominator;
        if !ray_t.contains_including(t) {
            return None;
        }

        let point = ray.at(t);
        let lower_left_to_hitpoint = self.lower_left.to(point);

        let alpha = self.w.dot(lower_left_to_hitpoint.cross(self.v));
        let beta = self.w.dot(self.u.cross(lower_left_to_hitpoint));

        let valid_alpha_range = Interval::new(0.0, 1.0);
        let valid_beta_range = Interval::new(0.0, 1.0);

        if !valid_alpha_range.contains_including(alpha)
            || !valid_beta_range.contains_including(beta)
        {
            return None;
        }

        let u = alpha;
        let v = beta;

        Some(RayHit {
            t,
            point,
            normal: self.normal,
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
        let alpha: f64 = rand::random();
        let beta: f64 = rand::random();
        let p = self.lower_left + alpha * self.u + beta * self.v;

        origin.to(p).unit_vector()
    }

    fn direction_pdf(&self, origin: Point, direction: Vector3) -> f64 {
        // go from the origin to the hit point
        let ray = Ray::new(origin, direction, 0.0);

        // did we hit? we might not because it's not a guarantee that the direction was generated from our own sampler!
        let Some(hit) = self.intersect(ray, Interval::new(0.001, f64::INFINITY)) else {
            return 0.0;
        };

        // assuming we hit, convert the area density to solid angle density using the Jacobian:
        let cos_theta = direction.dot(hit.normal).abs();
        if cos_theta < 1e-8 {
            return 0.0;
        }

        let area = self.surface_area();

        (hit.t * hit.t) / (cos_theta * area)
    }
}

#[cfg(test)]
mod tests {
    use crate::shading::materials::Lambertian;

    use super::*;

    #[test]
    fn hits_front_center() {
        let p = Parallelogram::new(
            Point::new(0.0, 0.0, 0.0),
            Vector3::new(1.0, 0.0, 0.0),
            Vector3::new(0.0, 1.0, 0.0),
            Arc::new(Lambertian::white()),
        );

        let ray = Ray::new(Point::new(0.5, 0.5, 1.0), Vector3::new(0.0, 0.0, -1.0), 0.0);
        let ray_t = Interval::new(0.0, f64::INFINITY);

        let opt_hit = p.intersect(ray, ray_t);
        assert!(opt_hit.is_some());
        let hit = opt_hit.unwrap();

        assert_eq!(hit.normal, Vector3::new(0.0, 0.0, 1.0));
        assert_eq!(hit.u, 0.5);
        assert_eq!(hit.v, 0.5);
        assert_eq!(hit.point, Point::new(0.5, 0.5, 0.0));
        assert_eq!(hit.t, 1.0);
    }

    #[test]
    fn hits_back_center() {
        let p = Parallelogram::new(
            Point::new(0.0, 0.0, 0.0),
            Vector3::new(1.0, 0.0, 0.0),
            Vector3::new(0.0, 1.0, 0.0),
            Arc::new(Lambertian::white()),
        );

        let ray = Ray::new(Point::new(0.5, 0.5, -1.0), Vector3::new(0.0, 0.0, 1.0), 0.0);
        let ray_t = Interval::new(0.0, f64::INFINITY);

        let opt_hit = p.intersect(ray, ray_t);
        assert!(opt_hit.is_some());
        let hit = opt_hit.unwrap();

        assert_eq!(hit.normal, Vector3::new(0.0, 0.0, 1.0));
        assert_eq!(hit.u, 0.5);
        assert_eq!(hit.v, 0.5);
        assert_eq!(hit.point, Point::new(0.5, 0.5, 0.0));
        assert_eq!(hit.t, 1.0);
    }

    #[test]
    fn misses_to_right() {
        let p = Parallelogram::new(
            Point::new(0.0, 0.0, 0.0),
            Vector3::new(1.0, 0.0, 0.0),
            Vector3::new(0.0, 1.0, 0.0),
            Arc::new(Lambertian::white()),
        );

        let ray = Ray::new(Point::new(1.5, 0.5, 1.0), Vector3::new(0.0, 0.0, -1.0), 0.0);
        let ray_t = Interval::new(0.0, f64::INFINITY);

        let opt_hit = p.intersect(ray, ray_t);
        assert!(opt_hit.is_none());
    }

    #[test]
    fn misses_above() {
        let p = Parallelogram::new(
            Point::new(0.0, 0.0, 0.0),
            Vector3::new(1.0, 0.0, 0.0),
            Vector3::new(0.0, 1.0, 0.0),
            Arc::new(Lambertian::white()),
        );

        let ray = Ray::new(Point::new(0.5, 1.5, 1.0), Vector3::new(0.0, 0.0, -1.0), 0.0);
        let ray_t = Interval::new(0.0, f64::INFINITY);

        let opt_hit = p.intersect(ray, ray_t);
        assert!(opt_hit.is_none());
    }

    #[test]
    fn misses_off_plane_parallel() {
        let p = Parallelogram::new(
            Point::new(0.0, 0.0, 0.0),
            Vector3::new(1.0, 0.0, 0.0),
            Vector3::new(0.0, 1.0, 0.0),
            Arc::new(Lambertian::white()),
        );

        let ray = Ray::new(Point::new(0.5, 0.5, 1.0), Vector3::new(1.0, 0.0, 0.0), 0.0);
        let ray_t = Interval::new(0.0, f64::INFINITY);

        let opt_hit = p.intersect(ray, ray_t);
        assert!(opt_hit.is_none());
    }

    #[test]
    fn misses_on_plane_parallel() {
        let p = Parallelogram::new(
            Point::new(0.0, 0.0, 0.0),
            Vector3::new(1.0, 0.0, 0.0),
            Vector3::new(0.0, 1.0, 0.0),
            Arc::new(Lambertian::white()),
        );

        let ray = Ray::new(Point::new(0.5, 0.5, 0.0), Vector3::new(1.0, 0.0, 0.0), 0.0);
        let ray_t = Interval::new(0.0, f64::INFINITY);

        let opt_hit = p.intersect(ray, ray_t);
        assert!(opt_hit.is_none());
    }

    #[test]
    fn hits_edge() {
        let p = Parallelogram::new(
            Point::new(0.0, 0.0, 0.0),
            Vector3::new(1.0, 0.0, 0.0),
            Vector3::new(0.0, 1.0, 0.0),
            Arc::new(Lambertian::white()),
        );

        let ray = Ray::new(Point::new(0.0, 0.5, 1.0), Vector3::new(0.0, 0.0, -1.0), 0.0);
        let ray_t = Interval::new(0.0, f64::INFINITY);

        let opt_hit = p.intersect(ray, ray_t);
        assert!(opt_hit.is_some());
        let hit = opt_hit.unwrap();

        assert_eq!(hit.normal, Vector3::new(0.0, 0.0, 1.0));
        assert_eq!(hit.u, 0.0);
        assert_eq!(hit.v, 0.5);
        assert_eq!(hit.point, Point::new(0.0, 0.5, 0.0));
        assert_eq!(hit.t, 1.0);
    }

    #[test]
    fn hits_corner() {
        let p = Parallelogram::new(
            Point::new(0.0, 0.0, 0.0),
            Vector3::new(1.0, 0.0, 0.0),
            Vector3::new(0.0, 1.0, 0.0),
            Arc::new(Lambertian::white()),
        );

        let ray = Ray::new(Point::new(0.0, 0.0, 1.0), Vector3::new(0.0, 0.0, -1.0), 0.0);
        let ray_t = Interval::new(0.0, f64::INFINITY);

        let opt_hit = p.intersect(ray, ray_t);
        assert!(opt_hit.is_some());
        let hit = opt_hit.unwrap();

        assert_eq!(hit.normal, Vector3::new(0.0, 0.0, 1.0));
        assert_eq!(hit.u, 0.0);
        assert_eq!(hit.v, 0.0);
        assert_eq!(hit.point, Point::new(0.0, 0.0, 0.0));
        assert_eq!(hit.t, 1.0);
    }
}
