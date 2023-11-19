use auto_ops::*;
use std::{
    fs::File,
    io::Write,
    ops::{Add, AddAssign, Div, DivAssign, Index, IndexMut, Mul, MulAssign, Sub, SubAssign},
};

#[derive(Debug, Clone, Copy)]
struct Color {
    red: u8,
    green: u8,
    blue: u8,
}

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
                let r = x as f64 / (width - 1) as f64;
                let g = y as f64 / (height - 1) as f64;
                let b = 0.2;
                let red = (r * 255.0) as u8;
                let green = (g * 255.0) as u8;
                let blue = (b * 255.0) as u8;
                col.push(Color { red, green, blue });
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

    fn as_unit_vector(&self) -> Self {
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

// impl Add for Vector3 {
//     type Output = Self;

//     fn add(self, rhs: Self) -> Self::Output {
//         Self {
//             x: self.x + rhs.x,
//             y: self.y + rhs.y,
//             z: self.z + rhs.z,
//         }
//     }
// }

// impl AddAssign for Vector3 {
//     fn add_assign(&mut self, rhs: Self) {
//         self.x += rhs.x;
//         self.y += rhs.y;
//         self.z += rhs.z;
//     }
// }

// impl Sub for Vector3 {
//     type Output = Self;

//     fn sub(self, rhs: Self) -> Self::Output {
//         Self {
//             x: self.x - rhs.x,
//             y: self.y - rhs.y,
//             z: self.z - rhs.z,
//         }
//     }
// }

// impl SubAssign for Vector3 {
//     fn sub_assign(&mut self, rhs: Self) {
//         self.x -= rhs.x;
//         self.y -= rhs.y;
//         self.z -= rhs.z;
//     }
// }

// impl Mul for Vector3 {
//     type Output = Self;

//     fn mul(self, rhs: Self) -> Self::Output {
//         Self {
//             x: self.x * rhs.x,
//             y: self.y * rhs.y,
//             z: self.z * rhs.z,
//         }
//     }
// }

// impl Mul<f64> for Vector3 {
//     type Output = Self;

//     fn mul(self, rhs: f64) -> Self::Output {
//         Self {
//             x: self.x * rhs,
//             y: self.y * rhs,
//             z: self.z * rhs,
//         }
//     }
// }

// impl Mul<Vector3> for f64 {
//     type Output = Vector3;

//     fn mul(self, rhs: Vector3) -> Self::Output {
//         Vector3 {
//             x: self * rhs.x,
//             y: self * rhs.y,
//             z: self * rhs.z,
//         }
//     }
// }

// impl MulAssign for Vector3 {
//     fn mul_assign(&mut self, rhs: Self) {
//         self.x *= rhs.x;
//         self.y *= rhs.y;
//         self.z *= rhs.z;
//     }
// }

// impl MulAssign<f64> for Vector3 {
//     fn mul_assign(&mut self, rhs: f64) {
//         self.x *= rhs;
//         self.y *= rhs;
//         self.z *= rhs;
//     }
// }

// impl Div for Vector3 {
//     type Output = Self;

//     fn div(self, rhs: Self) -> Self::Output {
//         Self {
//             x: self.x / rhs.x,
//             y: self.y / rhs.y,
//             z: self.z / rhs.z,
//         }
//     }
// }

// // impl Div for &Vector3 {
// //     type Output = Vector3;

// //     fn div(self, rhs: Self) -> Self::Output {
// //         Vector3 {
// //             x: self.x / rhs.x,
// //             y: self.y / rhs.y,
// //             z: self.z / rhs.z,
// //         }
// //     }
// // }

// impl Div<f64> for Vector3 {
//     type Output = Self;

//     fn div(self, rhs: f64) -> Self::Output {
//         Self {
//             x: self.x / rhs,
//             y: self.y / rhs,
//             z: self.z / rhs,
//         }
//     }
// }

// impl DivAssign for Vector3 {
//     fn div_assign(&mut self, rhs: Self) {
//         self.x /= rhs.x;
//         self.y /= rhs.y;
//         self.z /= rhs.z;
//     }
// }

// impl DivAssign<f64> for Vector3 {
//     fn div_assign(&mut self, rhs: f64) {
//         self.x /= rhs;
//         self.y /= rhs;
//         self.z /= rhs;
//     }
// }
