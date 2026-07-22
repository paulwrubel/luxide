use std::sync::Arc;

use crate::{
    geometry::{Aabb, Geometric, Onb, Point, Ray, RayHit, Vector3},
    shading::materials::Material,
    utils::Interval,
};

#[derive(Clone, Debug)]
pub struct Plane {
    point: Point,
    normal: Vector3,
    plane_d: f64,
    onb: Onb,
    bounding_box: Aabb,
    material: Arc<dyn Material>,
}

impl Plane {
    pub fn new(point: Point, normal: Vector3, material: Arc<dyn Material>) -> Self {
        let normal = normal.unit_vector();
        let onb = Onb::from_w(normal);
        let bounding_box = Aabb::new(
            if onb.u.x.abs() > 0.0 || onb.v.x.abs() > 0.0 {
                Interval::UNIVERSE
            } else {
                Interval::new(point.0.x, point.0.x)
            },
            if onb.u.y.abs() > 0.0 || onb.v.y.abs() > 0.0 {
                Interval::UNIVERSE
            } else {
                Interval::new(point.0.y, point.0.y)
            },
            if onb.u.z.abs() > 0.0 || onb.v.z.abs() > 0.0 {
                Interval::UNIVERSE
            } else {
                Interval::new(point.0.z, point.0.z)
            },
        );
        Self {
            point,
            normal,
            plane_d: point.0.dot(normal),
            onb,
            bounding_box,
            material,
        }
    }
}

impl Geometric for Plane {
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

        let hit_point = ray.at(t);

        // unbounded UV coordinates — plane extends infinitely
        let u = (hit_point - self.point).dot(self.onb.u);
        let v = (hit_point - self.point).dot(self.onb.v);

        Some(RayHit {
            t,
            point: hit_point,
            normal: self.normal,
            material: Arc::clone(&self.material),
            u,
            v,
        })
    }

    fn surface_area(&self) -> f64 {
        f64::INFINITY
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
        false
    }

    fn bounding_box(&self) -> Aabb {
        self.bounding_box
    }

    fn center(&self) -> Point {
        // a plane's bounding box is UNIVERSE, so the default centroid would be
        // NaN; use the plane's defining point as a finite center instead.
        self.point
    }

    fn sample_direction_from(&self, origin: Point) -> Vector3 {
        // determine which side of the plane the origin is on
        let dir_to_point = self.point.0 - origin.0;
        let side = dir_to_point.dot(self.normal);
        let sign = if side > 0.0 { 1.0 } else { -1.0 };

        // hemisphere axis pointing toward the plane
        let w = self.normal * -sign;

        // cosine-weighted hemisphere sampling
        let r1: f64 = rand::random();
        let r2: f64 = rand::random();
        let phi = 2.0 * std::f64::consts::PI * r1;
        let cos_theta = r2.sqrt();
        let sin_theta = (1.0 - r2).sqrt();

        // build direction in local space using ONB
        let u = self.onb.u * (sin_theta * phi.cos());
        let v = self.onb.v * (sin_theta * phi.sin());

        (u + v + w * cos_theta).unit_vector()
    }

    fn direction_pdf(&self, _origin: Point, _dir: Vector3) -> f64 {
        // infinite surface area - zero probability density for any finite solid angle
        0.0
    }
}
