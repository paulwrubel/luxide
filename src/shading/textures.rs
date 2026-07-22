use crate::geometry::Point;

use super::{ColorSpectrum, color_spectrum::SPECTRAL_SAMPLE_COUNT};

mod checker;
pub use checker::Checker;

mod image;
pub use image::ImageLinearF64;

mod noise;
pub use noise::Noise;

mod solid_color;
pub use solid_color::SolidColor;

pub trait Texture: std::fmt::Debug + Sync + Send {
    fn value(&self, u: f64, v: f64, p: Point) -> ColorSpectrum<SPECTRAL_SAMPLE_COUNT>;
}
