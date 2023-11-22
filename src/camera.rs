use image::ImageBuffer;

use crate::{
    geometry::{
        primitives::{Hit, List, Sphere},
        Point, Ray, Vector,
    },
    shading::Color,
    utils::Interval,
};

#[derive(Debug, Clone, Copy, PartialEq, Default)]
pub struct Camera {
    pub aspect_ratio: f64,
    pub image_width: u32,

    image_height: u32,
    center: Point,
    pixel_00_location: Point,
    pixel_delta_u: Vector,
    pixel_delta_v: Vector,
}

impl Camera {
    pub fn new(aspect_ratio: f64, image_width: u32) -> Self {
        Self {
            aspect_ratio,
            image_width,
            ..Default::default()
        }
    }

    pub fn render(&mut self, primitive: &dyn Hit) -> ImageBuffer<image::Rgb<u8>, Vec<u8>> {
        self.init();

        let mut buffer = ImageBuffer::new(self.image_width, self.image_height);
        for y in 0..self.image_height {
            println!(
                "{:>6.1}% done... [{}/{} rows remaining]",
                (y as f64 / self.image_height as f64) * 100.0,
                self.image_height - y,
                self.image_height
            );
            for x in 0..self.image_width {
                let pixel = buffer.get_pixel_mut(x, y);

                let pixel_center = self.pixel_00_location
                    + self.pixel_delta_u * x as f64
                    + self.pixel_delta_v * y as f64;
                let direction = pixel_center - self.center;
                let ray = Ray::new(self.center, direction);
                let color = self.ray_color(&ray, primitive);
                *pixel = (color * 255.999).as_rgb_u8();
            }
        }

        buffer
    }

    fn init(&mut self) {
        self.image_height = ((self.image_width as f64 / self.aspect_ratio) as u32).max(1);

        self.center = Point::new(0.0, 0.0, 0.0);

        // Camera
        let focal_length = 1.0;
        let viewport_height = 2.0;
        let viewport_width = viewport_height * (self.image_width as f64 / self.image_height as f64);

        // Viewport
        let viewport_u = Vector::new(viewport_width, 0.0, 0.0);
        let viewport_v = Vector::new(0.0, -viewport_height, 0.0);

        self.pixel_delta_u = viewport_u / self.image_width as f64;
        self.pixel_delta_v = viewport_v / self.image_height as f64;

        let viewport_upper_left =
            self.center - Vector::new(0.0, 0.0, focal_length) - viewport_u / 2.0 - viewport_v / 2.0;

        self.pixel_00_location =
            viewport_upper_left + 0.5 * (self.pixel_delta_u + self.pixel_delta_v);
    }

    fn ray_color(&self, ray: &Ray, primitive: &dyn Hit) -> Color {
        // Get the hit point color if we hit something
        if let Some(rec) = primitive.hit(ray, Interval::new(0.0, f64::INFINITY)) {
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
