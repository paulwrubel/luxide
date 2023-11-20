use auto_ops::*;
use image::{ImageBuffer, ImageError, Rgb};

pub struct Image(ImageBuffer<Rgb<u8>, Vec<u8>>);

impl Image {
    pub fn generate(width: u32, height: u32) -> Self {
        let mut buffer = ImageBuffer::new(width, height);

        for (x, y, pixel) in buffer.enumerate_pixels_mut() {
            *pixel = (Vector {
                x: x as f64 / (width - 1) as f64,
                y: (height - y - 1) as f64 / (height - 1) as f64,
                z: 0.2,
            } * 255.0)
                .as_rgb_u8();
        }

        Self(buffer)
    }

    pub fn save(&self, filename: &str) -> Result<(), ImageError> {
        self.0.save(filename)?;
        Ok(())
    }
}

#[derive(Debug, Copy, Clone, PartialEq)]
struct Vector {
    x: f64,
    y: f64,
    z: f64,
}

impl Vector {
    fn new(x: f64, y: f64, z: f64) -> Self {
        Self { x, y, z }
    }

    fn length(&self) -> f64 {
        self.squared_length().sqrt()
    }

    fn squared_length(&self) -> f64 {
        self.x * self.x + self.y * self.y + self.z * self.z
    }

    fn normalize(&mut self) {
        *self /= self.length();
    }

    fn unit_vector(&self) -> Self {
        self / self.length()
    }

    fn dot(&self, other: &Self) -> f64 {
        self.x * other.x + self.y * other.y + self.z * other.z
    }

    fn cross(&self, other: &Self) -> Self {
        Self {
            x: self.y * other.z - self.z * other.y,
            y: self.z * other.x - self.x * other.z,
            z: self.x * other.y - self.y * other.x,
        }
    }

    fn as_rgb_u8(&self) -> Rgb<u8> {
        Rgb([self.x as u8, self.y as u8, self.z as u8])
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
struct Point(Vector);

impl Point {
    fn new(x: f64, y: f64, z: f64) -> Self {
        Self(Vector::new(x, y, z))
    }

    fn from_vector(vector: &Vector) -> Self {
        Self(*vector)
    }

    fn as_vector(&self) -> Vector {
        self.0
    }
}

impl_op_ex!(+ |a: &Point, b: &Vector| -> Point {
    Point(a.0 + b)
});

impl_op_ex!(+= |a: &mut Point, b: &Vector| {
    a.0 += b;
});

impl_op_ex!(-|a: &Point, b: &Vector| -> Point { Point(a.0 - b) });

impl_op_ex!(-= |a: &mut Point, b: &Vector|  {
    a.0 -= b;
});

struct Ray {
    origin: Point,
    direction: Vector,
}
