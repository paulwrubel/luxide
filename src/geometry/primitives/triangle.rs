use std::sync::Arc;

use crate::{
    geometry::{AABB, Geometric, Point, Ray, RayHit, Vector},
    shading::materials::Material,
    utils::Interval,
};

#[derive(Clone)]
pub struct Triangle {
    a: Point,
    b: Point,
    c: Point,
    a_normal: Vector,
    b_normal: Vector,
    c_normal: Vector,
    is_culled: bool,
    material: Arc<dyn Material>,
    bounding_box: AABB,
}

impl Triangle {
    pub fn new(a: Point, b: Point, c: Point, is_culled: bool, material: Arc<dyn Material>) -> Self {
        let plane_normal = a.to(b).cross(a.to(c));

        Self::new_with_normals(
            a,
            b,
            c,
            plane_normal,
            plane_normal,
            plane_normal,
            is_culled,
            material,
        )
    }

    pub fn new_with_optional_normals(
        a: Point,
        b: Point,
        c: Point,
        a_normal: Option<Vector>,
        b_normal: Option<Vector>,
        c_normal: Option<Vector>,
        is_culled: bool,
        material: Arc<dyn Material>,
    ) -> Self {
        let plane_normal = a.to(b).cross(a.to(c));

        let a_normal = a_normal.unwrap_or(plane_normal);
        let b_normal = b_normal.unwrap_or(plane_normal);
        let c_normal = c_normal.unwrap_or(plane_normal);

        Self::new_with_normals(a, b, c, a_normal, b_normal, c_normal, is_culled, material)
    }

    pub fn new_with_normals(
        a: Point,
        b: Point,
        c: Point,
        a_normal: Vector,
        b_normal: Vector,
        c_normal: Vector,
        is_culled: bool,
        material: Arc<dyn Material>,
    ) -> Self {
        let bounding_box = AABB::from_points(&[a, b, c]).pad(0.0001);

        Self {
            a,
            b,
            c,
            a_normal: a_normal.unit_vector(),
            b_normal: b_normal.unit_vector(),
            c_normal: c_normal.unit_vector(),
            is_culled,
            material,
            bounding_box,
        }
    }

    pub fn intersect_moller_trumbore(&self, ray: Ray, ray_t: Interval) -> Option<RayHit> {
        let ab = self.a.to(self.b);
        let ac = self.a.to(self.c);

        let p_vector = ray.direction.cross(ac);
        let determinant = ab.dot(p_vector);

        // determine planar intersection
        if self.is_culled && determinant <= -1e-8 {
            // if we are culled, then back-hitting rays do not intersect
            return None;
        } else if determinant.abs() <= 1e-8 {
            // if the ray is parallel to the plane, then there is no intersection
            return None;
        }

        // check barycentric coordinates' weights to determine if the ray intersects the triangle
        let inverse_determinant = 1.0 / determinant;

        let t_vector = self.a.to(ray.origin);
        let u = inverse_determinant * t_vector.dot(p_vector);
        if u < 0.0 || u > 1.0 {
            return None;
        }

        let q_vector = t_vector.cross(ab);
        let v = inverse_determinant * ray.direction.dot(q_vector);
        if v < 0.0 || u + v > 1.0 {
            return None;
        }

        let barycentric_alpha = 1.0 - u - v;
        let barycentric_beta = u;
        let barycentric_gamma = v;

        let t = inverse_determinant * ac.dot(q_vector);
        if !ray_t.contains_including(t) {
            return None;
        }

        // find normal for the specific point on the triangle we hit
        let local_normal = self.normal_at(barycentric_alpha, barycentric_beta, barycentric_gamma);

        // invert the normal if we are are not culled and the ray hits the back side
        let local_normal = if !self.is_culled && determinant < 0.0 {
            -local_normal
        } else {
            local_normal
        };

        Some(RayHit {
            t,
            point: ray.at(t),
            normal: local_normal,
            material: Arc::clone(&self.material),
            u: 0.0,
            v: 0.0,
        })
    }

    fn normal_at(
        &self,
        barycentric_alpha: f64,
        barycentric_beta: f64,
        barycentric_gamma: f64,
    ) -> Vector {
        (barycentric_alpha * self.a_normal
            + barycentric_beta * self.b_normal
            + barycentric_gamma * self.c_normal)
            .unit_vector()
    }
}

impl Geometric for Triangle {
    fn intersect(&self, ray: Ray, ray_t: Interval) -> Option<RayHit> {
        self.intersect_moller_trumbore(ray, ray_t)
    }

    fn bounding_box(&self) -> AABB {
        self.bounding_box
    }
}
