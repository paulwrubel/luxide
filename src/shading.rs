use auto_ops::{impl_op_ex, impl_op_ex_commutative};

use crate::geometry::Vector;

#[derive(Debug, Copy, Clone, PartialEq)]
pub struct Color(Vector);

impl Color {
    pub fn new(r: f64, g: f64, b: f64) -> Self {
        Self(Vector::new(r, g, b))
    }

    pub fn from_vector(vector: &Vector) -> Self {
        Self(*vector)
    }

    pub fn as_rgb_u8(&self) -> image::Rgb<u8> {
        image::Rgb([self.0.x as u8, self.0.y as u8, self.0.z as u8])
    }
}

impl_op_ex_commutative!(*|a: &Color, b: &f64| -> Color {
    Color(Vector {
        x: a.0.x * b,
        y: a.0.y * b,
        z: a.0.z * b,
    })
});

impl_op_ex!(*= |a: &mut Color, b: &f64| {
    a.0.x *= b;
    a.0.y *= b;
    a.0.z *= b;
});

impl_op_ex_commutative!(/|a: &Color, b: &f64| -> Color {
    Color(Vector {
        x: a.0.x / b,
        y: a.0.y / b,
        z: a.0.z / b,
    })
});

impl_op_ex!(/= |a: &mut Color, b: &f64| {
    a.0.x /= b;
    a.0.y /= b;
    a.0.z /= b;
});
