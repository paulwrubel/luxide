use crate::geometry::Point;

use super::Color;

mod checker;
pub use checker::Checker;

mod image;
pub use image::Image8Bit;

mod noise;
pub use noise::Noise;

mod solid_color;
pub use solid_color::SolidColor;

pub trait Texture: std::fmt::Debug + Sync + Send {
    fn value(&self, u: f64, v: f64, p: Point) -> Color;
}
