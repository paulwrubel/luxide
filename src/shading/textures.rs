use crate::geometry::Point;

use super::Color;

mod checker;
pub use checker::Checker;

mod image;
pub use image::Image8Bit;

mod solid_color;
pub use solid_color::SolidColor;

pub trait Texture: Sync + Send {
    fn value(&self, u: f64, v: f64, p: Point) -> Color;
}