use auto_ops::{impl_op_ex, impl_op_ex_commutative};
use bincode::{Decode, Encode};
use image::Rgba;

use crate::geometry::Vector3;

const SRGB_GAMMA: f64 = 2.2;

#[derive(Debug, Copy, Clone, PartialEq, Default, Encode, Decode)]
pub struct ColorRgb(Vector3);

impl ColorRgb {
    pub const BLACK: ColorRgb = Self(Vector3::ZERO);
    pub const WHITE: ColorRgb = Self(Vector3::ONE);
    pub const RED: ColorRgb = Self(Vector3::UNIT_X);
    pub const GREEN: ColorRgb = Self(Vector3::UNIT_Y);
    pub const BLUE: ColorRgb = Self(Vector3::UNIT_Z);

    pub fn new(r: f64, g: f64, b: f64) -> Self {
        Self(Vector3::new(r, g, b))
    }

    pub fn random() -> Self {
        Self(Vector3::random())
    }

    pub fn random_range(min: f64, max: f64) -> Self {
        Self(Vector3::random_range(min, max))
    }

    pub fn from_vector(vector: Vector3) -> Self {
        Self(vector)
    }

    pub fn decode_from_srgb_u8(rgba: &Rgba<u8>) -> Self {
        Self(Vector3::new(
            (rgba.0[0] as f64 / u8::MAX as f64).powf(SRGB_GAMMA),
            (rgba.0[1] as f64 / u8::MAX as f64).powf(SRGB_GAMMA),
            (rgba.0[2] as f64 / u8::MAX as f64).powf(SRGB_GAMMA),
        ))
    }

    pub fn scale_down(&self, scale: f64) -> Self {
        Self(self.0.scale_down(scale))
    }

    pub fn de_nan(&self) -> Self {
        Self(self.0.de_nan())
    }

    pub fn as_rgba_u8(&self) -> image::Rgba<u8> {
        let vec = self.0.de_nan();
        image::Rgba([
            (vec.x.clamp(0.0, 1.0) * u8::MAX as f64).round() as u8,
            (vec.y.clamp(0.0, 1.0) * u8::MAX as f64).round() as u8,
            (vec.z.clamp(0.0, 1.0) * u8::MAX as f64).round() as u8,
            u8::MAX,
        ])
    }

    pub fn encode_to_srgb_u8(&self) -> image::Rgba<u8> {
        let vec = self.0.de_nan();
        image::Rgba([
            (vec.x.powf(1.0 / SRGB_GAMMA).clamp(0.0, 1.0) * u8::MAX as f64).round() as u8,
            (vec.y.powf(1.0 / SRGB_GAMMA).clamp(0.0, 1.0) * u8::MAX as f64).round() as u8,
            (vec.z.powf(1.0 / SRGB_GAMMA).clamp(0.0, 1.0) * u8::MAX as f64).round() as u8,
            u8::MAX,
        ])
    }

    /// Returns the largest RGB component value.
    /// Used for Russian roulette survival probability heuristics.
    pub fn max_component(self) -> f64 {
        self.0.max_component()
    }
}

impl From<[f64; 3]> for ColorRgb {
    fn from(v: [f64; 3]) -> Self {
        Self::new(v[0], v[1], v[2])
    }
}

impl From<ColorRgb> for [f64; 3] {
    fn from(value: ColorRgb) -> Self {
        [value.0.x, value.0.y, value.0.z]
    }
}

impl_op_ex!(+|a: &ColorRgb, b: &ColorRgb| -> ColorRgb { ColorRgb(a.0 + b.0) });

impl_op_ex!(+= |a: &mut ColorRgb, b: &ColorRgb| {
    a.0 += b.0;
});

impl_op_ex!(-|a: &ColorRgb, b: &ColorRgb| -> ColorRgb { ColorRgb(a.0 - b.0) });

impl_op_ex!(-= |a: &mut ColorRgb, b: &ColorRgb| {
    a.0 -= b.0;
});

impl_op_ex!(*|a: &ColorRgb, b: &ColorRgb| -> ColorRgb { ColorRgb(a.0 * b.0) });

impl_op_ex_commutative!(*|a: &ColorRgb, b: &f64| -> ColorRgb { ColorRgb(a.0 * b) });

impl_op_ex!(*= |a: &mut ColorRgb, b: &ColorRgb| {
    a.0 *= b.0;
});

impl_op_ex!(*= |a: &mut ColorRgb, b: &f64| {
    a.0 *= b;
});

impl_op_ex_commutative!(/|a: &ColorRgb, b: &f64| -> ColorRgb {
    ColorRgb(a.0 / b)
});

impl_op_ex!(/= |a: &mut ColorRgb, b: &f64| {
    a.0 /= b;
});
