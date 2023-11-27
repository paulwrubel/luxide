use auto_ops::{impl_op_ex, impl_op_ex_commutative};
use image::Rgba;

use crate::geometry::Vector;

#[derive(Debug, Copy, Clone, PartialEq)]
pub struct Color(Vector);

impl Color {
    pub const BLACK: Color = Self(Vector::ZERO);
    pub const WHITE: Color = Self(Vector::ONE);

    pub fn new(r: f64, g: f64, b: f64) -> Self {
        Self(Vector::new(r, g, b))
    }

    pub fn random() -> Self {
        Self(Vector::random())
    }

    pub fn random_range(min: f64, max: f64) -> Self {
        Self(Vector::random_range(min, max))
    }

    pub fn from_vector(vector: Vector) -> Self {
        Self(vector)
    }

    pub fn from_rgba(rgba: &Rgba<u8>) -> Self {
        Self(Vector::new(
            rgba.0[0] as f64 / u8::MAX as f64,
            rgba.0[1] as f64 / u8::MAX as f64,
            rgba.0[2] as f64 / u8::MAX as f64,
        ))
    }

    pub fn as_rgba_u8(&self) -> image::Rgba<u8> {
        image::Rgba([
            (self.0.x.clamp(0.0, 1.0) * u8::MAX as f64).round() as u8,
            (self.0.y.clamp(0.0, 1.0) * u8::MAX as f64).round() as u8,
            (self.0.z.clamp(0.0, 1.0) * u8::MAX as f64).round() as u8,
            u8::MAX,
        ])
    }

    pub fn as_gamma_corrected_rgba_u8(&self, gamma: f64) -> image::Rgba<u8> {
        image::Rgba([
            (self.0.x.powf(gamma).clamp(0.0, 1.0) * u8::MAX as f64).round() as u8,
            (self.0.y.powf(gamma).clamp(0.0, 1.0) * u8::MAX as f64).round() as u8,
            (self.0.z.powf(gamma).clamp(0.0, 1.0) * u8::MAX as f64).round() as u8,
            u8::MAX,
        ])
    }
}

impl_op_ex!(+|a: &Color, b: &Color| -> Color { Color(a.0 + b.0) });

impl_op_ex!(+= |a: &mut Color, b: &Color| {
    a.0 += b.0;
});

impl_op_ex!(-|a: &Color, b: &Color| -> Color { Color(a.0 - b.0) });

impl_op_ex!(-= |a: &mut Color, b: &Color| {
    a.0 -= b.0;
});

impl_op_ex!(*|a: &Color, b: &Color| -> Color { Color(a.0 * b.0) });

impl_op_ex_commutative!(*|a: &Color, b: &f64| -> Color { Color(a.0 * b) });

impl_op_ex!(*= |a: &mut Color, b: &Color| {
    a.0 *= b.0;
});

impl_op_ex!(*= |a: &mut Color, b: &f64| {
    a.0 *= b;
});

impl_op_ex_commutative!(/|a: &Color, b: &f64| -> Color {
    Color(a.0 / b)
});

impl_op_ex!(/= |a: &mut Color, b: &f64| {
    a.0 /= b;
});
