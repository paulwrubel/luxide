use super::{Point, Vector3};

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Ray {
    pub origin: Point,
    pub direction: Vector3,
    pub time: f64,
}

impl Ray {
    pub fn new(origin: Point, direction: Vector3, time: f64) -> Self {
        Self {
            origin,
            direction,
            time,
        }
    }

    pub fn at(&self, t: f64) -> Point {
        self.origin + (t * self.direction)
    }
}
