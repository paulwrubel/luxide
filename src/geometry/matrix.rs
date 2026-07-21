use auto_ops::impl_op_ex;

use crate::geometry::{Point, Vector3};

use super::quaternion::Quaternion;

/// A 3×3 matrix, stored in row-major order.
#[derive(Clone, Copy, Debug)]
pub struct Matrix3 {
    m: [[f64; 3]; 3],
}

impl Matrix3 {
    /// Create a matrix from raw row-major data.
    pub fn new(m: [[f64; 3]; 3]) -> Self {
        Self { m }
    }

    /// Return the transpose of this matrix.
    pub fn transpose(&self) -> Self {
        Self {
            m: [
                [self.m[0][0], self.m[1][0], self.m[2][0]],
                [self.m[0][1], self.m[1][1], self.m[2][1]],
                [self.m[0][2], self.m[1][2], self.m[2][2]],
            ],
        }
    }
}

impl From<Quaternion> for Matrix3 {
    /// Build a rotation matrix from a unit quaternion.
    fn from(q: Quaternion) -> Self {
        let w = q.w;
        let x = q.x;
        let y = q.y;
        let z = q.z;
        let xx = x * x;
        let yy = y * y;
        let zz = z * z;
        let xy = x * y;
        let xz = x * z;
        let yz = y * z;
        let wx = w * x;
        let wy = w * y;
        let wz = w * z;

        Self::new([
            [1.0 - 2.0 * (yy + zz), 2.0 * (xy - wz), 2.0 * (xz + wy)],
            [2.0 * (xy + wz), 1.0 - 2.0 * (xx + zz), 2.0 * (yz - wx)],
            [2.0 * (xz - wy), 2.0 * (yz + wx), 1.0 - 2.0 * (xx + yy)],
        ])
    }
}

impl_op_ex!(*|a: &Matrix3, b: &Vector3| -> Vector3 {
    let m = &a.m;
    Vector3::new(
        m[0][0] * b.x + m[0][1] * b.y + m[0][2] * b.z,
        m[1][0] * b.x + m[1][1] * b.y + m[1][2] * b.z,
        m[2][0] * b.x + m[2][1] * b.y + m[2][2] * b.z,
    )
});

impl_op_ex!(*|a: &Matrix3, b: &Point| -> Point { Point::from_vector3(a * b.0) });
