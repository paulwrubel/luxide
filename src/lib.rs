use std::path::Path;

use geometry::primitives::{Hit, List, Sphere};
use geometry::{Point, Ray, Vector};
use image::{ImageBuffer, ImageError, Rgb};

mod camera;
mod geometry;
mod shading;

pub struct Image(ImageBuffer<Rgb<u8>, Vec<u8>>);

impl Image {
    pub fn generate(width: u32, aspect_ratio: f64) -> Self {
        let height = (width as f64 / aspect_ratio) as u32;
        let height = if height < 1 { 1 } else { height };

        // Camera

        let focal_length = 1.0;
        let viewport_height = 2.0;
        let viewport_width = viewport_height * (width as f64 / height as f64);
        let camera_center = Point::new(0.0, 0.0, 0.0);

        let mut buffer = ImageBuffer::new(width, height);

        // let llc = Point::new(-2.0, -1.0, -1.0);
        // let horizontal = Vector::new(4.0, 0.0, 0.0);
        // let vertical = Vector::new(0.0, 2.0, 0.0);
        // let origin = Point::new(0.0, 0.0, 0.0);

        let viewport_u = Vector::new(viewport_width, 0.0, 0.0);
        let viewport_v = Vector::new(0.0, -viewport_height, 0.0);
        let pixel_delta_u = viewport_u / width as f64;
        let pixel_delta_v = viewport_v / height as f64;

        let viewport_upper_left = camera_center
            - Vector::new(0.0, 0.0, focal_length)
            - viewport_u / 2.0
            - viewport_v / 2.0;

        let pixel_00_point = viewport_upper_left + 0.5 * (pixel_delta_u + pixel_delta_v);

        let world: Box<dyn Hit> = Box::new(List::from_vec(vec![
            Box::new(Sphere::new(Point::new(0.0, 0.0, -1.0), 0.5)),
            Box::new(Sphere::new(Point::new(0.0, -100.5, -1.0), 100.0)),
        ]));

        for y in 0..height {
            println!(
                "{:>6.1}% done... [{}/{} rows remaining]",
                (y as f64 / height as f64) * 100.0,
                height - y,
                height
            );
            for x in 0..width {
                let pixel = buffer.get_pixel_mut(x, y);

                // let u = x as f64 / width as f64;
                // let v = (height - y - 1) as f64 / height as f64;
                let pixel_center =
                    pixel_00_point + pixel_delta_u * x as f64 + pixel_delta_v * y as f64;
                let direction = pixel_center - camera_center;
                let ray = Ray::new(camera_center, direction);
                let color = ray.color(&world);
                *pixel = (color * 255.999).as_rgb_u8();
            }
        }

        // imageops::flip_vertical_in_place(&mut buffer);

        Self(buffer)
    }

    pub fn save(&self, filename: &Path) -> Result<(), ImageError> {
        self.0.save(filename)?;
        Ok(())
    }
}
