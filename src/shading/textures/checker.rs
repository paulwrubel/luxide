use std::sync::Arc;

use crate::{geometry::Point, shading::Color};

use super::{SolidColor, Texture};

#[derive(Debug, Clone)]
pub struct Checker {
    inverse_scale: f64,
    even: Arc<dyn Texture>,
    odd: Arc<dyn Texture>,
}

impl Checker {
    pub fn new(scale: f64, even: Arc<dyn Texture>, odd: Arc<dyn Texture>) -> Self {
        Self {
            inverse_scale: 1.0 / scale,
            even,
            odd,
        }
    }

    pub fn from_colors(scale: f64, even: Color, odd: Color) -> Self {
        Self {
            inverse_scale: 1.0 / scale,
            even: Arc::new(SolidColor::new(even)),
            odd: Arc::new(SolidColor::new(odd)),
        }
    }
}

impl Texture for Checker {
    fn value(&self, u: f64, v: f64, p: Point) -> Color {
        let x_int = (p.0.x * self.inverse_scale).floor() as i32;
        let y_int = (p.0.y * self.inverse_scale).floor() as i32;
        let z_int = (p.0.z * self.inverse_scale).floor() as i32;

        let is_even = (x_int + y_int + z_int) % 2 == 0;

        if is_even {
            self.even.value(u, v, p)
        } else {
            self.odd.value(u, v, p)
        }
    }
}
