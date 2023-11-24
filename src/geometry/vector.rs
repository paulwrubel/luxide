use std::ops::Neg;

use auto_ops::{impl_op_ex, impl_op_ex_commutative};
use rand::Rng;

#[derive(Debug, Copy, Clone, PartialEq, Default)]
pub struct Vector {
    pub x: f64,
    pub y: f64,
    pub z: f64,
}

impl Vector {
    pub const ZERO: Self = Self {
        x: 0.0,
        y: 0.0,
        z: 0.0,
    };
    pub const ONE: Self = Self {
        x: 1.0,
        y: 1.0,
        z: 1.0,
    };

    pub fn new(x: f64, y: f64, z: f64) -> Self {
        Self { x, y, z }
    }

    pub fn random() -> Self {
        let mut rng = rand::thread_rng();
        Self {
            x: rng.gen(),
            y: rng.gen(),
            z: rng.gen(),
        }
    }

    pub fn random_in_unit_sphere() -> Self {
        let mut rng = rand::thread_rng();
        loop {
            let p = Self {
                x: rng.gen_range(-1.0..1.0),
                y: rng.gen_range(-1.0..1.0),
                z: rng.gen_range(-1.0..1.0),
            };
            if p.squared_length() < 1.0 {
                return p;
            }
        }
    }

    pub fn random_in_unit_disk() -> Self {
        let mut rng = rand::thread_rng();
        loop {
            let p = Self {
                x: rng.gen_range(-1.0..1.0),
                y: rng.gen_range(-1.0..1.0),
                z: 0.0,
            };
            if p.squared_length() < 1.0 {
                return p;
            }
        }
    }

    pub fn random_unit() -> Self {
        Self::random_in_unit_sphere().unit_vector()
    }

    pub fn random_on_hemisphere(normal: &Self) -> Self {
        let on_unit_sphere = Self::random_unit();
        if on_unit_sphere.dot(normal) > 0.0 {
            on_unit_sphere
        } else {
            -on_unit_sphere
        }
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

    pub fn is_near_zero(&self) -> bool {
        let s = 1e-8;
        self.x.abs() < s && self.y.abs() < s && self.z.abs() < s
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

    pub fn reflect_around(&self, normal: &Self) -> Self {
        self - 2.0 * self.dot(normal) * normal
    }

    pub fn refract_around(&self, normal: &Self, etai_over_etat: f64) -> Self {
        let cos_theta = (-self).dot(normal).min(1.0);
        let perpendicular_component = etai_over_etat * (self + cos_theta * normal);
        let parallel_component = -((1.0 - perpendicular_component.squared_length())
            .abs()
            .sqrt())
            * normal;
        perpendicular_component + parallel_component
    }
}

impl Neg for &Vector {
    type Output = Vector;

    fn neg(self) -> Self::Output {
        *self * -1.0
    }
}

impl Neg for Vector {
    type Output = Self;

    fn neg(self) -> Self::Output {
        self * -1.0
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
