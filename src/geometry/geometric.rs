use crate::{
    geometry::{Point, Vector3},
    utils::Interval,
};

use super::{Aabb, Ray, RayHit};

pub trait Geometric: std::fmt::Debug + Sync + Send {
    fn intersect(&self, ray: Ray, ray_t: Interval) -> Option<RayHit>;
    /// Whether any point on this geometric object emits light.
    /// Delegates to the material for primitives, OR of children for compounds.
    fn is_emissive(&self) -> bool;

    /// Whether this geometric object transmits light (glass / dielectric).
    fn is_transmissive(&self) -> bool;

    /// Whether this geometric object reflects specularly (mirror / metal).
    fn is_specular(&self) -> bool;

    /// Whether this geometric object contains no primitives.
    fn is_empty(&self) -> bool;

    fn surface_area(&self) -> f64;
    fn bounding_box(&self) -> Aabb;

    /// The center point of this geometric, used as the pivot for rotation and
    /// scale instances with `around: "center"`.
    ///
    /// Defaults to the bounding-box centroid. Primitives whose bounding box can
    /// be infinite (e.g. an infinite-ended cylinder, or a plane) MUST override
    /// this to return a finite, well-defined center — otherwise the centroid of
    /// an unbounded box is `NaN`, which poisons the pivot and breaks rendering.
    fn center(&self) -> Point {
        self.bounding_box().center()
    }

    /// Sample a random direction from `origin` toward a point on this object's
    /// surface, chosen uniformly by area. The returned direction is a unit vector.
    fn sample_direction_from(&self, origin: Point) -> Vector3;
    /// The solid-angle probability density that [`sample_direction_from`] would
    /// assign to `dir`. Returns 0.0 if `dir` does not intersect this object.
    ///
    /// Internally, this shoots `Ray(origin, dir)` and converts the uniform
    /// area density to solid-angle density using the Jacobian:
    ///
    /// ```text
    /// p_solid_angle = distance² / (|cos(θ_light)| × area)
    /// ```
    ///
    /// where `distance` is the ray parameter at the hit point, `cos(θ_light)`
    /// is the absolute cosine between the direction and the surface normal at
    /// the hit, and `area` is the total surface area.
    fn direction_pdf(&self, origin: Point, dir: Vector3) -> f64;

    /// Whether this geometric is "virtual" — excluded from ray intersections
    /// but included in importance sampling for faster convergence.
    fn is_virtual(&self) -> bool {
        false
    }
}
