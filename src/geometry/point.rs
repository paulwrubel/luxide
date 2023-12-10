use std::ops::{Index, IndexMut, Neg};

use auto_ops::impl_op_ex;

use super::Vector;

#[derive(Debug, Clone, Copy, PartialEq, Default)]
pub struct Point(pub Vector);

impl Point {
    pub const ZERO: Point = Self(Vector::ZERO);
    pub const ONE: Point = Self(Vector::ONE);
    pub const ORIGIN: Point = Self::ZERO;
    pub const INFINITY: Point = Self(Vector::INFINITY);

    pub fn new(x: f64, y: f64, z: f64) -> Self {
        Self(Vector::new(x, y, z))
    }

    pub fn from_vector(vector: Vector) -> Self {
        Self(vector)
    }

    pub fn min_components_point(&self, other: Self) -> Point {
        Self::new(
            self.0.x.min(other.0.x),
            self.0.y.min(other.0.y),
            self.0.z.min(other.0.z),
        )
    }

    pub fn max_components_point(&self, other: Self) -> Point {
        Self::new(
            self.0.x.max(other.0.x),
            self.0.y.max(other.0.y),
            self.0.z.max(other.0.z),
        )
    }

    pub fn min_components_from_list(points: &[Self]) -> Point {
        if points.len() == 0 {
            panic!("Cannot get min point from empty list");
        }
        points
            .iter()
            .fold(Point::INFINITY, |a, b| a.min_components_point(*b))
    }

    pub fn max_components_from_list(points: &[Self]) -> Point {
        if points.len() == 0 {
            panic!("Cannot get max point from empty list");
        }
        points
            .iter()
            .fold(-Point::INFINITY, |a, b| a.max_components_point(*b))
    }

    pub fn to(&self, other: Self) -> Vector {
        other - self
    }

    pub fn from(&self, other: Self) -> Vector {
        self - other
    }

    pub fn as_vector(&self) -> Vector {
        self.0
    }
}

impl From<[f64; 3]> for Point {
    fn from(v: [f64; 3]) -> Self {
        Self(Vector::new(v[0], v[1], v[2]))
    }
}

impl Neg for Point {
    type Output = Point;

    fn neg(self) -> Self::Output {
        Point::from_vector(self.0 * -1.0)
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
