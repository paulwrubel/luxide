use std::path::Path;

use geometry::primitives::{Hit, List, Sphere};
use geometry::{Point, Ray, Vector};
use image::{ImageBuffer, ImageError, Rgb};
use shading::Color;

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

        // Viewport
        let viewport_u = Vector::new(viewport_width, 0.0, 0.0);
        let viewport_v = Vector::new(0.0, -viewport_height, 0.0);
        let pixel_delta_u = viewport_u / width as f64;
        let pixel_delta_v = viewport_v / height as f64;

        let viewport_upper_left = camera_center
            - Vector::new(0.0, 0.0, focal_length)
            - viewport_u / 2.0
            - viewport_v / 2.0;

        let pixel_00_point = viewport_upper_left + 0.5 * (pixel_delta_u + pixel_delta_v);

        // Primitives
        let world: Box<dyn Hit> = Box::new(List::from_vec(vec![
            Box::new(Sphere::new(Point::new(0.0, 0.0, -1.0), 0.5)),
            Box::new(Sphere::new(Point::new(0.0, -100.5, -1.0), 100.0)),
        ]));

        let mut buffer = ImageBuffer::new(width, height);
        for y in 0..height {
            println!(
                "{:>6.1}% done... [{}/{} rows remaining]",
                (y as f64 / height as f64) * 100.0,
                height - y,
                height
            );
            for x in 0..width {
                let pixel = buffer.get_pixel_mut(x, y);

                let pixel_center =
                    pixel_00_point + pixel_delta_u * x as f64 + pixel_delta_v * y as f64;
                let direction = pixel_center - camera_center;
                let ray = Ray::new(camera_center, direction);
                let color = Self::trace_ray(&ray, world.as_ref());
                *pixel = (color * 255.999).as_rgb_u8();
            }
        }

        Self(buffer)
    }

    pub fn save(&self, filename: &Path) -> Result<(), ImageError> {
        self.0.save(filename)?;
        Ok(())
    }

    fn trace_ray(ray: &Ray, primitive: &dyn Hit) -> Color {
        // Get the hit point color if we hit something
        if let Some(rec) = primitive.hit(ray, 0.0, f64::MAX) {
            let color_vec = 0.5 * (rec.normal + Vector::new(1.0, 1.0, 1.0));
            return Color::from_vector(&color_vec);
        }

        // otherwise, get the background
        let unit = ray.direction().unit_vector();
        let a = 0.5 * (unit.y + 1.0);

        let color_vec = (1.0 - a) * Vector::new(1.0, 1.0, 1.0) + a * Vector::new(0.5, 0.7, 1.0);
        Color::from_vector(&color_vec)
    }
}
