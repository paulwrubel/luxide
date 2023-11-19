use auto_ops::*;
use std::{
    fs::File,
    io::Write,
    ops::{Index, IndexMut},
};

pub struct Image {
    width: u32,
    height: u32,
    data: Vec<Vec<Color>>,
}

impl Image {
    pub fn generate(width: u32, height: u32) -> Self {
        let mut data = Vec::with_capacity(width.try_into().unwrap());
        for x in 0..width {
            let mut col = Vec::with_capacity(height.try_into().unwrap());
            for y in (0..height).rev() {
                let mut vector = Vector3 {
                    x: x as f64 / (width - 1) as f64,
                    y: y as f64 / (height - 1) as f64,
                    z: 0.2,
                };
                vector *= 255.0;
                col.push(vector.as_color());
            }
            data.push(col);
        }

        Self {
            width,
            height,
            data,
        }
    }

    pub fn to_ppm(&self, file: &mut File) -> std::io::Result<()> {
        file.write_all(format!("P3\n{} {}\n255\n", self.width, self.height).as_bytes())?;

        for y in 0..self.height {
            for x in 0..self.width {
                let Color { red, green, blue } = self.data[x as usize][y as usize];
                file.write_all(format!("{red} {green} {blue}\n").as_bytes())?;
            }
        }
        Ok(())
    }
}

#[derive(Debug, Copy, Clone, PartialEq)]
struct Vector3 {
    x: f64,
    y: f64,
    z: f64,
}

impl Vector3 {
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

    fn as_color(&self) -> Color {
        Color {
            red: self.x as u8,
            green: self.y as u8,
            blue: self.z as u8,
        }
    }
}

impl_op_ex!(+ |a: &Vector3, b: &Vector3| -> Vector3 {
    Vector3 {
        x: a.x + b.x,
        y: a.y + b.y,
        z: a.z + b.z,
    }
});

impl_op_ex!(+= |a: &mut Vector3, b: &Vector3| {
    a.x += b.x;
    a.y += b.y;
    a.z += b.z;
});

impl_op_ex!(-|a: &Vector3, b: &Vector3| -> Vector3 {
    Vector3 {
        x: a.x - b.x,
        y: a.y - b.y,
        z: a.z - b.z,
    }
});

impl_op_ex!(-= |a: &mut Vector3, b: &Vector3|  {
    a.x -= b.x;
    a.y -= b.y;
    a.z -= b.z;
});

impl_op_ex!(*|a: &Vector3, b: &Vector3| -> Vector3 {
    Vector3 {
        x: a.x * b.x,
        y: a.y * b.y,
        z: a.z * b.z,
    }
});

impl_op_ex_commutative!(*|a: &Vector3, b: &f64| -> Vector3 {
    Vector3 {
        x: a.x * b,
        y: a.y * b,
        z: a.z * b,
    }
});

impl_op_ex!(*= |a: &mut Vector3, b: &Vector3| {
    a.x *= b.x;
    a.y *= b.y;
    a.z *= b.z;
});

impl_op_ex!(*= |a: &mut Vector3, b: &f64| {
    a.x *= b;
    a.y *= b;
    a.z *= b;
});

impl_op_ex!(/|a: &Vector3, b: &Vector3| -> Vector3 {
    Vector3 {
        x: a.x / b.x,
        y: a.y / b.y,
        z: a.z / b.z,
    }
});

impl_op_ex_commutative!(/|a: &Vector3, b: &f64| -> Vector3 {
    Vector3 {
        x: a.x / b,
        y: a.y / b,
        z: a.z / b,
    }
});

impl_op_ex!(/= |a: &mut Vector3, b: &Vector3| {
    a.x /= b.x;
    a.y /= b.y;
    a.z /= b.z;
});

impl_op_ex!(/= |a: &mut Vector3, b: &f64| {
    a.x /= b;
    a.y /= b;
    a.z /= b;
});

impl Index<usize> for Vector3 {
    type Output = f64;

    fn index(&self, index: usize) -> &Self::Output {
        match index {
            0 => &self.x,
            1 => &self.y,
            2 => &self.z,
            _ => panic!("Index out of bounds"),
        }
    }
}

impl IndexMut<usize> for Vector3 {
    fn index_mut(&mut self, index: usize) -> &mut Self::Output {
        match index {
            0 => &mut self.x,
            1 => &mut self.y,
            2 => &mut self.z,
            _ => panic!("Index out of bounds"),
        }
    }
}

struct Color {
    red: u8,
    green: u8,
    blue: u8,
}

impl Color {
    fn new(red: u8, green: u8, blue: u8) -> Self {
        Self { red, green, blue }
    }
}
