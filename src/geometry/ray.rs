use super::{Point, Vector3};
use crate::shading::medium::Medium;

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Ray {
    pub origin: Point,
    pub direction: Vector3,
    pub time: f64,
    pub current_medium: Medium,
}

impl Ray {
    /// Create a ray in the default `Vacuum` medium.
    pub fn new(origin: Point, direction: Vector3, time: f64) -> Self {
        Self {
            origin,
            direction,
            time,
            current_medium: Medium::Vacuum,
        }
    }

    /// Create a ray traveling through the specified medium.
    pub fn new_with_medium(
        origin: Point,
        direction: Vector3,
        time: f64,
        current_medium: Medium,
    ) -> Self {
        Self {
            origin,
            direction,
            time,
            current_medium,
        }
    }

    pub fn at(&self, t: f64) -> Point {
        self.origin + (t * self.direction)
    }
}
