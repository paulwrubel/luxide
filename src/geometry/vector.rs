use auto_ops::{impl_op_ex, impl_op_ex_commutative};

#[derive(Debug, Copy, Clone, PartialEq)]
pub struct Vector {
    pub x: f64,
    pub y: f64,
    pub z: f64,
}

impl Vector {
    pub fn new(x: f64, y: f64, z: f64) -> Self {
        Self { x, y, z }
    }

    pub fn length(&self) -> f64 {
        self.squared_length().sqrt()
    }

    pub fn squared_length(&self) -> f64 {
        self.x * self.x + self.y * self.y + self.z * self.z
    }

    pub fn normalize(&mut self) {
        *self /= self.length();
    }

    pub fn unit_vector(&self) -> Self {
        self / self.length()
    }

    pub fn dot(&self, other: &Self) -> f64 {
        self.x * other.x + self.y * other.y + self.z * other.z
    }

    pub fn cross(&self, other: &Self) -> Self {
        Self {
            x: self.y * other.z - self.z * other.y,
            y: self.z * other.x - self.x * other.z,
            z: self.x * other.y - self.y * other.x,
        }
    }
}

impl_op_ex!(+ |a: &Vector, b: &Vector| -> Vector {
    Vector {
        x: a.x + b.x,
        y: a.y + b.y,
        z: a.z + b.z,
    }
});

impl_op_ex!(+= |a: &mut Vector, b: &Vector| {
    a.x += b.x;
    a.y += b.y;
    a.z += b.z;
});

impl_op_ex!(-|a: &Vector, b: &Vector| -> Vector {
    Vector {
        x: a.x - b.x,
        y: a.y - b.y,
        z: a.z - b.z,
    }
});

impl_op_ex!(-= |a: &mut Vector, b: &Vector|  {
    a.x -= b.x;
    a.y -= b.y;
    a.z -= b.z;
});

impl_op_ex!(*|a: &Vector, b: &Vector| -> Vector {
    Vector {
        x: a.x * b.x,
        y: a.y * b.y,
        z: a.z * b.z,
    }
});

impl_op_ex_commutative!(*|a: &Vector, b: &f64| -> Vector {
    Vector {
        x: a.x * b,
        y: a.y * b,
        z: a.z * b,
    }
});

impl_op_ex!(*= |a: &mut Vector, b: &Vector| {
    a.x *= b.x;
    a.y *= b.y;
    a.z *= b.z;
});

impl_op_ex!(*= |a: &mut Vector, b: &f64| {
    a.x *= b;
    a.y *= b;
    a.z *= b;
});

impl_op_ex!(/|a: &Vector, b: &Vector| -> Vector {
    Vector {
        x: a.x / b.x,
        y: a.y / b.y,
        z: a.z / b.z,
    }
});

impl_op_ex_commutative!(/|a: &Vector, b: &f64| -> Vector {
    Vector {
        x: a.x / b,
        y: a.y / b,
        z: a.z / b,
    }
});

impl_op_ex!(/= |a: &mut Vector, b: &Vector| {
    a.x /= b.x;
    a.y /= b.y;
    a.z /= b.z;
});

impl_op_ex!(/= |a: &mut Vector, b: &f64| {
    a.x /= b;
    a.y /= b;
    a.z /= b;
});
