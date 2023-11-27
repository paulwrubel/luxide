use crate::{geometry::Point, shading::Color};

use super::Texture;

pub struct SolidColor(Color);

impl SolidColor {
    pub fn new(color: Color) -> Self {
        Self(color)
    }

    pub fn from_rgb(r: f64, g: f64, b: f64) -> Self {
        Self(Color::new(r, g, b))
    }
}

impl Texture for SolidColor {
    fn value(&self, _u: f64, _v: f64, _p: Point) -> Color {
        self.0
    }
}
