use crate::{
    geometry::Point,
    shading::{ColorRgb, ColorSpectrum, color_spectrum::SPECTRAL_SAMPLE_COUNT},
    utils::Interval,
};

use super::Texture;

#[derive(Debug, Clone)]
pub struct ImageLinearF64 {
    pub width: u32,
    pub height: u32,
    pub data: Vec<[f64; 3]>,
}

impl ImageLinearF64 {
    pub fn from_filename(filename: &str) -> Result<Self, image::ImageError> {
        let image = image::open(filename)?.into_rgba8();
        let (width, height) = image.dimensions();

        let mut data = Vec::with_capacity((width * height) as usize);
        for p in image.pixels() {
            let linear: [f64; 3] = ColorRgb::decode_from_srgb_u8(p).into();
            data.push(linear);
        }

        Ok(Self {
            width,
            height,
            data,
        })
    }

    pub fn from_srgb_bytes(bytes: &[u8]) -> Result<Self, image::ImageError> {
        let image = image::load_from_memory(bytes)?.into_rgba8();
        let (width, height) = image.dimensions();

        let mut data = Vec::with_capacity((width * height) as usize);
        for p in image.pixels() {
            let linear: [f64; 3] = ColorRgb::decode_from_srgb_u8(p).into();
            data.push(linear);
        }

        Ok(Self {
            width,
            height,
            data,
        })
    }
}

impl Texture for ImageLinearF64 {
    fn value(&self, u: f64, v: f64, _p: Point) -> ColorSpectrum<SPECTRAL_SAMPLE_COUNT> {
        let u = Interval::new(0.0, 1.0).clamp(u);
        let v = 1.0 - Interval::new(0.0, 1.0).clamp(v);

        let x = ((u * self.width as f64) as u32).clamp(0, self.width.saturating_sub(1));
        let y = ((v * self.height as f64) as u32).clamp(0, self.height.saturating_sub(1));

        let idx = (y * self.width + x) as usize;
        let pixel = self.data[idx];

        ColorRgb::new(pixel[0], pixel[1], pixel[2]).into()
    }
}
