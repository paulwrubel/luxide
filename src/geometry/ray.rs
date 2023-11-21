use crate::shading::Color;

use super::{primitives::Hit, Point, Vector};

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Ray {
    origin: Point,
    direction: Vector,
}

impl Ray {
    pub fn new(origin: Point, direction: Vector) -> Self {
        Self { origin, direction }
    }

    pub fn origin(&self) -> Point {
        self.origin
    }

    pub fn direction(&self) -> Vector {
        self.direction
    }

    pub fn at(&self, t: f64) -> Point {
        self.origin + (t * self.direction)
    }

    pub fn color(&self, primitive: &Box<dyn Hit>) -> Color {
        if let Some(rec) = primitive.hit(self, 0.0, f64::MAX) {
            let color_vec = 0.5 * (rec.normal + Vector::new(1.0, 1.0, 1.0));
            return Color::from_vector(&color_vec);
        }

        let unit = self.direction.unit_vector();
        let a = 0.5 * (unit.y + 1.0);

        let color_vec = (1.0 - a) * Vector::new(1.0, 1.0, 1.0) + a * Vector::new(0.5, 0.7, 1.0);
        Color::from_vector(&color_vec)
    }
}
