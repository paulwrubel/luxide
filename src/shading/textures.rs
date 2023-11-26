use super::Color;

mod solid_color;
pub use solid_color::SolidColor;

pub trait Texture {
    fn value(&self, u: f64, v: f64) -> Color;
}
