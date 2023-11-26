use super::{Point, Vector};

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Ray {
    pub origin: Point,
    pub direction: Vector,
    pub time: f64,
}

impl Ray {
    pub fn new(origin: Point, direction: Vector, time: f64) -> Self {
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
