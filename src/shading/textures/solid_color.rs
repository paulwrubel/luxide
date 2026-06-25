use crate::{
    geometry::Point,
    shading::{ColorRgb, ColorSpectrum, color_spectrum::SPECTRAL_SAMPLE_COUNT},
};

use super::Texture;

#[derive(Debug, Clone)]
pub struct SolidColor(ColorSpectrum<SPECTRAL_SAMPLE_COUNT>);

impl SolidColor {
    pub const BLACK: Self = Self(ColorSpectrum::ZERO);
    pub const WHITE: Self = Self(ColorSpectrum::ONE);

    pub fn new(color: ColorSpectrum<SPECTRAL_SAMPLE_COUNT>) -> Self {
        Self(color)
    }

    pub fn from_rgb(r: f64, g: f64, b: f64) -> Self {
        Self(ColorRgb::new(r, g, b).into())
    }
}

impl From<ColorRgb> for SolidColor {
    fn from(color: ColorRgb) -> Self {
        Self(color.into())
    }
}

impl Texture for SolidColor {
    fn value(&self, _u: f64, _v: f64, _p: Point) -> ColorSpectrum<SPECTRAL_SAMPLE_COUNT> {
        self.0
    }
}
