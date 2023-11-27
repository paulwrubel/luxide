use std::ops::{Index, IndexMut};

use auto_ops::impl_op_ex;

use super::Vector;

#[derive(Debug, Clone, Copy, PartialEq, Default)]
pub struct Point(pub Vector);

impl Point {
    pub const ZERO: Point = Self(Vector::ZERO);
    pub const ONE: Point = Self(Vector::ONE);

    pub fn new(x: f64, y: f64, z: f64) -> Self {
        Self(Vector::new(x, y, z))
    }

    pub fn to(&self, other: Self) -> Vector {
        other - self
    }

    pub fn from(&self, other: Self) -> Vector {
        self - other
    }

    pub fn from_vector(vector: Vector) -> Self {
        Self(vector)
    }

    pub fn as_vector(&self) -> Vector {
        self.0
    }
}

impl Index<usize> for Point {
    type Output = f64;

    fn index(&self, index: usize) -> &Self::Output {
        &self.0[index]
    }
}

impl IndexMut<usize> for Point {
    fn index_mut(&mut self, index: usize) -> &mut Self::Output {
        &mut self.0[index]
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
