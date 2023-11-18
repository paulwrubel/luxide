use std::{fs::File, io::Write};

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
