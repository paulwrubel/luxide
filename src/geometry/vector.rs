use std::ops::{Add, AddAssign, Div, DivAssign, Mul, MulAssign, Sub, SubAssign};

/// A fixed-size numeric array with element-wise arithmetic.
///
/// Unlike the geometric `Vector3`, this type has no geometric interpretation —
/// no cross product, no normalization, no spatial semantics. It is purely
/// for arithmetic on fixed-size arrays of scalars.
#[derive(Debug, Copy, Clone, PartialEq)]
pub struct Vector<const N: usize>(pub [f64; N]);

impl<const N: usize> Default for Vector<N> {
    fn default() -> Self {
        Self::ZERO
    }
}

impl<const N: usize> Vector<N> {
    /// All elements set to zero.
    pub const ZERO: Self = Self([0.0; N]);

    /// All elements set to zero.
    pub const ONE: Self = Self([1.0; N]);

    /// Create from an array.
    pub fn new(data: [f64; N]) -> Self {
        Self(data)
    }

    /// Iterate over the elements by reference.
    pub fn iter(&self) -> std::slice::Iter<'_, f64> {
        self.0.iter()
    }

    /// Iterate over the elements mutably.
    pub fn iter_mut(&mut self) -> std::slice::IterMut<'_, f64> {
        self.0.iter_mut()
    }
}

// ---------------------------------------------------------------------------
// Element-wise operators (Vector<N> × Vector<N>)
// ---------------------------------------------------------------------------

impl<const N: usize> Add<&Vector<N>> for &Vector<N> {
    type Output = Vector<N>;
    fn add(self, rhs: &Vector<N>) -> Vector<N> {
        let mut data = self.0;
        for (x, &y) in data.iter_mut().zip(rhs.0.iter()) {
            *x += y;
        }
        Vector(data)
    }
}

impl<const N: usize> AddAssign<&Vector<N>> for Vector<N> {
    fn add_assign(&mut self, rhs: &Vector<N>) {
        for (x, &y) in self.0.iter_mut().zip(rhs.0.iter()) {
            *x += y;
        }
    }
}

impl<const N: usize> AddAssign<Vector<N>> for Vector<N> {
    fn add_assign(&mut self, rhs: Vector<N>) {
        for (x, y) in self.0.iter_mut().zip(rhs.0.iter()) {
            *x += *y;
        }
    }
}

impl<const N: usize> Sub<&Vector<N>> for &Vector<N> {
    type Output = Vector<N>;
    fn sub(self, rhs: &Vector<N>) -> Vector<N> {
        let mut data = self.0;
        for (x, &y) in data.iter_mut().zip(rhs.0.iter()) {
            *x -= y;
        }
        Vector(data)
    }
}

impl<const N: usize> SubAssign<&Vector<N>> for Vector<N> {
    fn sub_assign(&mut self, rhs: &Vector<N>) {
        for (x, &y) in self.0.iter_mut().zip(rhs.0.iter()) {
            *x -= y;
        }
    }
}

impl<const N: usize> Mul<&Vector<N>> for &Vector<N> {
    type Output = Vector<N>;
    fn mul(self, rhs: &Vector<N>) -> Vector<N> {
        let mut data = self.0;
        for (x, &y) in data.iter_mut().zip(rhs.0.iter()) {
            *x *= y;
        }
        Vector(data)
    }
}

impl<const N: usize> Mul<Vector<N>> for Vector<N> {
    type Output = Vector<N>;
    fn mul(self, rhs: Vector<N>) -> Vector<N> {
        &self * &rhs
    }
}

impl<const N: usize> MulAssign<&Vector<N>> for Vector<N> {
    fn mul_assign(&mut self, rhs: &Vector<N>) {
        for (x, &y) in self.0.iter_mut().zip(rhs.0.iter()) {
            *x *= y;
        }
    }
}

impl<const N: usize> MulAssign<Vector<N>> for Vector<N> {
    fn mul_assign(&mut self, rhs: Vector<N>) {
        for (x, y) in self.0.iter_mut().zip(rhs.0.iter()) {
            *x *= *y;
        }
    }
}

// ---------------------------------------------------------------------------
// Scalar operators (Vector<N> × f64)
// ---------------------------------------------------------------------------

impl<const N: usize> Mul<f64> for &Vector<N> {
    type Output = Vector<N>;
    fn mul(self, rhs: f64) -> Vector<N> {
        let mut data = self.0;
        for x in &mut data {
            *x *= rhs;
        }
        Vector(data)
    }
}

impl<const N: usize> Mul<f64> for Vector<N> {
    type Output = Vector<N>;
    fn mul(self, rhs: f64) -> Vector<N> {
        let mut data = self.0;
        for x in &mut data {
            *x *= rhs;
        }
        Vector(data)
    }
}

impl<const N: usize> Mul<&Vector<N>> for f64 {
    type Output = Vector<N>;
    fn mul(self, rhs: &Vector<N>) -> Vector<N> {
        rhs * self
    }
}

impl<const N: usize> MulAssign<f64> for Vector<N> {
    fn mul_assign(&mut self, rhs: f64) {
        for x in &mut self.0 {
            *x *= rhs;
        }
    }
}

impl<const N: usize> Div<f64> for &Vector<N> {
    type Output = Vector<N>;
    fn div(self, rhs: f64) -> Vector<N> {
        let mut data = self.0;
        for x in &mut data {
            *x /= rhs;
        }
        Vector(data)
    }
}

impl<const N: usize> DivAssign<f64> for Vector<N> {
    fn div_assign(&mut self, rhs: f64) {
        for x in &mut self.0 {
            *x /= rhs;
        }
    }
}

// ---------------------------------------------------------------------------
// Indexing
// ---------------------------------------------------------------------------

impl<const N: usize> std::ops::Index<usize> for Vector<N> {
    type Output = f64;
    fn index(&self, index: usize) -> &f64 {
        &self.0[index]
    }
}

impl<const N: usize> std::ops::IndexMut<usize> for Vector<N> {
    fn index_mut(&mut self, index: usize) -> &mut f64 {
        &mut self.0[index]
    }
}

impl<'a, const N: usize> IntoIterator for &'a Vector<N> {
    type Item = &'a f64;
    type IntoIter = std::slice::Iter<'a, f64>;
    fn into_iter(self) -> Self::IntoIter {
        self.0.iter()
    }
}

impl<'a, const N: usize> IntoIterator for &'a mut Vector<N> {
    type Item = &'a mut f64;
    type IntoIter = std::slice::IterMut<'a, f64>;
    fn into_iter(self) -> Self::IntoIter {
        self.0.iter_mut()
    }
}
