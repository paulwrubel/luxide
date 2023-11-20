use auto_ops::*;
use geometry::{Point, Ray, Vector};
use image::{imageops, ImageBuffer, ImageError, Rgb};
use primitives::Sphere;

mod camera;
mod geometry;
mod primitives;

pub struct Image(ImageBuffer<Rgb<u8>, Vec<u8>>);

impl Image {
    pub fn generate(width: u32, height: u32) -> Self {
        let mut buffer = ImageBuffer::new(width, height);

        let llc = Point::new(-2.0, -1.0, -1.0);
        let horizontal = Vector::new(4.0, 0.0, 0.0);
        let vertical = Vector::new(0.0, 2.0, 0.0);
        let origin = Point::new(0.0, 0.0, 0.0);

        for (x, y, pixel) in buffer.enumerate_pixels_mut() {
            let u = x as f64 / width as f64;
            let v = y as f64 / height as f64;
            let ray = Ray::new(origin, (llc + u * horizontal + v * vertical) - origin);
            let color = ray.color();
            *pixel = (color * 255.0).as_rgb_u8();
        }

        imageops::flip_vertical_in_place(&mut buffer);

        Self(buffer)
    }

    pub fn save(&self, filename: &str) -> Result<(), ImageError> {
        self.0.save(filename)?;
        Ok(())
    }
}
