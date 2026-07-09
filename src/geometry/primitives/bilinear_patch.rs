use std::sync::Arc;

use crate::{
    geometry::{
        Aabb, Geometric, Point, Ray, RayHit, Vector3, compounds::List, primitives::Triangle,
    },
    shading::materials::Material,
    utils::Interval,
};

#[derive(Clone, Debug)]
pub struct BilinearPatch {
    p00: Point,
    p10: Point,
    p01: Point,
    p11: Point,
    material: Arc<dyn Material>,
    e00_10: Vector3,
    e00_01: Vector3,
    e01_11: Vector3,
    e10_11: Vector3,
    cross_edges: Vector3,
    bounding_box: Aabb,
    proxy_triangles_list: List,
}

impl BilinearPatch {
    pub fn new(
        p00: Point,
        p10: Point,
        p01: Point,
        p11: Point,
        material: Arc<dyn Material>,
    ) -> Self {
        let e00_10 = p10 - p00;
        let e00_01 = p01 - p00;
        let e01_11 = p11 - p01;
        let e10_11 = p11 - p10;
        let cross_edges = e01_11 - e00_10;
        let bounding_box = Aabb::from_points(&[p00, p10, p01, p11]).pad(0.0001);

        // two-triangle proxy for surface area, sampling, and PDF
        let tri1 = Arc::new(Triangle::new(p00, p10, p11, false, Arc::clone(&material)));
        let tri2 = Arc::new(Triangle::new(p00, p11, p01, false, Arc::clone(&material)));
        let proxy_triangles_list = List::from_vec(vec![tri1, tri2]);

        Self {
            p00,
            p10,
            p01,
            p11,
            material,
            e00_10,
            e00_01,
            e01_11,
            e10_11,
            cross_edges,
            bounding_box,
            proxy_triangles_list,
        }
    }

    fn point_at(&self, u: f64, v: f64) -> Point {
        let w00 = (1.0 - u) * (1.0 - v);
        let w10 = u * (1.0 - v);
        let w01 = (1.0 - u) * v;
        let w11 = u * v;
        Point::new(
            w00 * self.p00[0] + w10 * self.p10[0] + w01 * self.p01[0] + w11 * self.p11[0],
            w00 * self.p00[1] + w10 * self.p10[1] + w01 * self.p01[1] + w11 * self.p11[1],
            w00 * self.p00[2] + w10 * self.p10[2] + w01 * self.p01[2] + w11 * self.p11[2],
        )
    }
}

impl Geometric for BilinearPatch {
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
        self.proxy_triangles_list.surface_area() <= 0.0
    }

    fn surface_area(&self) -> f64 {
        self.proxy_triangles_list.surface_area()
    }

    fn bounding_box(&self) -> Aabb {
        self.bounding_box
    }

    // GARP (Griffin-Alexa-Rusu-Preda) intersection algorithm for bilinear patches.
    // solves a quadratic to find ruling-line parameter u where the ray is
    // coplanar with a bilinear ruling, then intersects the ray with that
    // ruling line to compute the v parameter.
    fn intersect(&self, ray: Ray, ray_t: Interval) -> Option<RayHit> {
        let origin_offset = ray.origin - self.p00;

        // helper: scalar triple product (D × a) · b = D · (a × b)
        let stp = |a: Vector3, b: Vector3| -> f64 { ray.direction.dot(a.cross(b)) };

        // GARP quadratic coefficients for u
        let a = -stp(self.cross_edges, self.e00_10);
        let b = stp(self.cross_edges, origin_offset) - stp(self.e00_01, self.e00_10);
        let c = stp(self.e00_01, origin_offset);

        let mut closest_hit: Option<RayHit> = None;
        let mut closest_t = ray_t.maximum;

        let u_candidates = crate::utils::solve_quadratic(a, b, c);
        for u in u_candidates {
            if !(0.0..=1.0).contains(&u) {
                continue;
            }

            // build the ruling line endpoints A(u) and B(u)
            let a_point = self.p00 + u * self.e00_10;
            let b_point = self.p01 + u * self.e01_11;
            let ruling = b_point - a_point;

            // intersect ray with the ruling line
            let d_cross_r = ray.direction.cross(ruling);
            let denom = d_cross_r.dot(d_cross_r);
            if denom < 1e-20 {
                continue; // ray parallel to ruling
            }

            let offset = a_point - ray.origin;

            let t = offset.cross(ruling).dot(d_cross_r) / denom;
            let v = offset.cross(ray.direction).dot(d_cross_r) / denom;

            if !(0.0..=1.0).contains(&v) {
                continue;
            }
            if !ray_t.contains_excluding(t) {
                continue;
            }
            if t >= closest_t {
                continue;
            }

            // compute normal from partial derivatives at (u, v)
            let dp_du = (1.0 - v) * self.e00_10 + v * self.e01_11;
            let dp_dv = (1.0 - u) * self.e00_01 + u * self.e10_11;
            let normal = dp_du.cross(dp_dv).unit_vector();

            // evaluate hit point via the bilinear function for numerical consistency
            let point = self.point_at(u, v);

            closest_hit = Some(RayHit {
                t,
                point,
                normal,
                material: Arc::clone(&self.material),
                u,
                v,
            });
            closest_t = t;
        }

        closest_hit
    }

    fn sample_direction_from(&self, origin: Point) -> Vector3 {
        self.proxy_triangles_list.sample_direction_from(origin)
    }

    fn direction_pdf(&self, origin: Point, direction: Vector3) -> f64 {
        self.proxy_triangles_list.direction_pdf(origin, direction)
    }
}
