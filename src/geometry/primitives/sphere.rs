use std::{f64::consts::PI, sync::Arc};

use crate::{
    geometry::{Aabb, Geometric, Onb, Point, Ray, RayHit, Vector},
    shading::materials::{Lambertian, Material},
    utils::Interval,
};

#[derive(Clone, Debug)]
pub struct Sphere {
    center_1: Point,
    center_vector: Option<Vector>,
    radius: f64,
    material: Arc<dyn Material>,
    bounding_box: Aabb,
}

impl Sphere {
    pub fn new(center: Point, radius: f64, material: Arc<dyn Material>) -> Self {
        let radius_vector = Vector::new(radius, radius, radius);
        Self {
            center_1: center,
            center_vector: None,
            radius,
            material: Arc::clone(&material),
            bounding_box: Aabb::from_points(&[center - radius_vector, center + radius_vector]),
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
            Aabb::from_points(&[center_1 - radius_vector, center_1 + radius_vector]);
        let bounding_box_2 =
            Aabb::from_points(&[center_2 - radius_vector, center_2 + radius_vector]);
        Self {
            center_1,
            center_vector: Some(center_1.to(center_2)),
            radius,
            material,
            bounding_box: Aabb::from_aabbs(bounding_box_1, bounding_box_2),
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

    /// Generate a random direction within the cone that subtends the sphere
    /// from a point at `distance_squared` away. The result is in the local
    /// frame where +Z points toward the sphere center.
    fn random_to_sphere(radius: f64, distance_squared: f64) -> Vector {
        let r1: f64 = rand::random();
        let r2: f64 = rand::random();
        let cos_theta_max = (1.0 - radius * radius / distance_squared).sqrt();
        let z = 1.0 + r2 * (cos_theta_max - 1.0);
        let phi = 2.0 * PI * r1;
        let sin_theta = (1.0 - z * z).sqrt();
        Vector::new(phi.cos() * sin_theta, phi.sin() * sin_theta, z)
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

    fn surface_area(&self) -> f64 {
        4.0 * PI * self.radius * self.radius
    }

    fn is_emissive(&self) -> bool {
        self.material.is_emissive()
    }

    fn bounding_box(&self) -> Aabb {
        self.bounding_box
    }

    fn sample_direction_from(&self, origin: Point) -> Vector {
        // sample the sphere as a cone from origin:
        // build an ONB with w pointing toward the sphere center,
        // then sample a direction uniformly within the cone subtended
        // by the sphere's visible disk
        let center = self.center_1;
        let to_center = origin.to(center);
        let distance_squared = to_center.squared_length();

        // degenerate: origin inside the sphere — sample the full sphere
        if distance_squared <= self.radius * self.radius {
            return Vector::random_unit();
        }

        let onb = Onb::from_w(to_center.unit_vector());
        let local_dir = Self::random_to_sphere(self.radius, distance_squared);
        onb.to_world(local_dir)
    }

    fn direction_pdf(&self, origin: Point, dir: Vector) -> f64 {
        // go from origin to the hit point
        let ray = Ray::new(origin, dir, 0.0);

        // did we hit? we might not because it's not a guarantee that the
        // direction was generated from our own sampler!
        if self
            .intersect(ray, Interval::new(0.001, f64::INFINITY))
            .is_none()
        {
            return 0.0;
        }

        let distance_squared = origin.to(self.center_1).squared_length();

        // if the origin is at or inside the sphere, the full sphere
        // is visible — solid angle is 4π
        if distance_squared <= self.radius * self.radius {
            return 1.0 / (4.0 * PI);
        }

        // cone half-angle from origin: sin(θ_max) = radius / distance
        let cos_theta_max = (1.0 - self.radius * self.radius / distance_squared).sqrt();
        let solid_angle = 2.0 * PI * (1.0 - cos_theta_max);
        1.0 / solid_angle
    }
}
