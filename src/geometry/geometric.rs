use crate::{
    geometry::{Point, Vector},
    utils::Interval,
};

use super::{Aabb, Ray, RayHit};

pub trait Geometric: std::fmt::Debug + Sync + Send {
    fn intersect(&self, ray: Ray, ray_t: Interval) -> Option<RayHit>;
    fn surface_area(&self) -> f64;
    fn bounding_box(&self) -> Aabb;

    /// Sample a random direction from `origin` toward a point on this object's
    /// surface, chosen uniformly by area. The returned direction is a unit vector.
    fn sample_direction_from(&self, origin: Point) -> Vector;
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
    fn direction_pdf(&self, origin: Point, dir: Vector) -> f64;
}
