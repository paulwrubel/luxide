use image::RgbaImage;

use crate::{
    geometry::Point,
    shading::{ColorRgb, ColorSpectrum, color_spectrum::SPECTRAL_SAMPLE_COUNT},
    utils::Interval,
};

use super::Texture;

#[derive(Debug, Clone)]
pub struct Image8Bit {
    pub image: RgbaImage,
}

impl Image8Bit {
    pub fn new(image: RgbaImage) -> Self {
        Self { image }
    }

    pub fn from_filename(filename: &str, gamma: f64) -> Result<Self, image::ImageError> {
        let mut image = image::open(filename)?.into_rgba8();

        // gamma correction
        for p in image.pixels_mut() {
            *p = ColorRgb::from_rgba_u8(p).as_gamma_corrected_rgba_u8(gamma);
        }

        Ok(Self::new(image))
    }
}

impl Texture for Image8Bit {
    fn value(&self, u: f64, v: f64, _p: Point) -> ColorSpectrum<SPECTRAL_SAMPLE_COUNT> {
        let u = Interval::new(0.0, 1.0).clamp(u);
        let v = 1.0 - Interval::new(0.0, 1.0).clamp(v);

        let x = (u * self.image.width() as f64) as u32;
        let y = (v * self.image.height() as f64) as u32;

        let pixel = self.image.get_pixel(x, y);

        ColorRgb::new(
            pixel[0] as f64 / 255.0,
            pixel[1] as f64 / 255.0,
            pixel[2] as f64 / 255.0,
        )
        .into()
    }
}
