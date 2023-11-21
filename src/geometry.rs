use auto_ops::{impl_op_ex, impl_op_ex_commutative};

use crate::primitives::{Hit, Sphere};

#[derive(Debug, Copy, Clone, PartialEq)]
pub struct Vector {
    x: f64,
    y: f64,
    z: f64,
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

    pub fn as_rgb_u8(&self) -> image::Rgb<u8> {
        image::Rgb([self.x as u8, self.y as u8, self.z as u8])
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

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Point(Vector);

impl Point {
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

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Ray {
    origin: Point,
    direction: Vector,
}

impl Ray {
    pub fn new(origin: Point, direction: Vector) -> Self {
        Self { origin, direction }
    }

    pub fn origin(&self) -> Point {
        self.origin
    }

    pub fn direction(&self) -> Vector {
        self.direction
    }

    pub fn point_at(&self, t: f64) -> Point {
        self.origin + (t * self.direction)
    }

    pub fn color(&self, primitive: &Box<dyn Hit>) -> Vector {
        if let Some(rec) = primitive.hit(self, 0.0, f64::MAX) {
            return 0.5 * (rec.normal + Vector::new(1.0, 1.0, 1.0));
        }

        let unit = self.direction.unit_vector();
        let t = 0.5 * (unit.y + 1.0);

        (1.0 - t) * Vector::new(1.0, 1.0, 1.0) + t * Vector::new(0.5, 0.7, 1.0)
    }
}
