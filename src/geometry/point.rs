use auto_ops::impl_op_ex;

use super::Vector;

#[derive(Debug, Clone, Copy, PartialEq, Default)]
pub struct Point(Vector);

impl Point {
    pub const ZERO: Point = Self(Vector::ZERO);
    pub const ONE: Point = Self(Vector::ONE);

    pub fn new(x: f64, y: f64, z: f64) -> Self {
        Self(Vector::new(x, y, z))
    }

    pub fn from_vector(vector: &Vector) -> Self {
        Self(*vector)
    }

    pub fn as_vector(&self) -> Vector {
        self.0
    }
}

impl_op_ex!(+ |a: &Point, b: &Vector| -> Point {
    Point(a.0 + b)
});

impl_op_ex!(+= |a: &mut Point, b: &Vector| {
    a.0 += b;
});

impl_op_ex!(-|a: &Point, b: &Point| -> Vector { a.0 - b.0 });

impl_op_ex!(-|a: &Point, b: &Vector| -> Point { Point(a.0 - b) });

impl_op_ex!(-= |a: &mut Point, b: &Vector|  {
    a.0 -= b;
});
