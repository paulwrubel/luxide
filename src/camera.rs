use std::{
    collections::VecDeque,
    time::{Duration, Instant},
};

use image::ImageBuffer;
use rand::Rng;

use crate::{
    geometry::{primitives::Hit, Point, Ray, Vector},
    shading::Color,
    utils::Interval,
};

#[derive(Debug, Clone, PartialEq, Default)]
pub struct Camera {
    // "public" fields
    aspect_ratio: f64,
    image_width: u32,
    samples_per_pixel: u32,
    max_bounces: u32,

    // private fields
    image_height: u32,
    center: Point,
    pixel_00_location: Point,
    pixel_delta_u: Vector,
    pixel_delta_v: Vector,

    progress_instants: VecDeque<Instant>,
}

impl Camera {
    pub fn new(
        aspect_ratio: f64,
        image_width: u32,
        samples_per_pixel: u32,
        max_bounces: u32,
    ) -> Self {
        Self {
            aspect_ratio,
            image_width,
            samples_per_pixel,
            max_bounces,
            ..Default::default()
        }
    }

    pub fn render(&mut self, primitive: &dyn Hit) -> ImageBuffer<image::Rgba<u8>, Vec<u8>> {
        self.init();

        let mut buffer = ImageBuffer::new(self.image_width, self.image_height);
        let start = Instant::now();
        for y in 0..self.image_height {
            if y > 0 {
                println!("{}", self.progress_string(y, self.image_height, start));
            }
            for x in 0..self.image_width {
                let mut color = Color::BLACK;
                for _ in 0..self.samples_per_pixel {
                    let ray = self.get_ray(x, y);
                    color += self.ray_color(&ray, primitive, self.max_bounces);
                }

                let pixel = buffer.get_pixel_mut(x, y);
                *pixel =
                    (color / self.samples_per_pixel as f64).as_gamma_corrected_rgba_u8(1.0 / 2.0);
            }
        }

        buffer
    }

    fn init(&mut self) {
        self.image_height = ((self.image_width as f64 / self.aspect_ratio) as u32).max(1);

        self.center = Point::ZERO;

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

    fn progress_string(&mut self, current: u32, total: u32, start: Instant) -> String {
        let progress = current as f64 / total as f64;
        let elapsed_duration = start.elapsed();

        let now = Instant::now();
        self.progress_instants.push_front(now);
        if self.progress_instants.len() > 50 {
            self.progress_instants.pop_back();
        }
        let mut averaged_increment_duration = Duration::new(0, 0);
        for i in (0..self.progress_instants.len() - 1).rev() {
            let increment_duration =
                self.progress_instants[i].duration_since(self.progress_instants[i + 1]);
            averaged_increment_duration +=
                increment_duration / (self.progress_instants.len() - 1) as u32;
        }

        let estimated_remaining_duration = averaged_increment_duration * (total - current);

        format!(
            "{:>6.1}% done... [{:>1.1}s elapsed, est. {:>1.1}s remaining]",
            progress * 100.0,
            elapsed_duration.as_secs_f32(),
            estimated_remaining_duration.as_secs_f32()
        )
    }

    fn get_ray(&self, x: u32, y: u32) -> Ray {
        let pixel_center = self.pixel_00_location
            + (self.pixel_delta_u * x as f64)
            + (self.pixel_delta_v * y as f64);
        let pixel_sample = pixel_center + self.pixel_sample_square();

        let origin = self.center;
        let direction = self.center.to(&pixel_sample);

        Ray::new(origin, direction)
    }

    fn pixel_sample_square(&self) -> Vector {
        let mut rng = rand::thread_rng();

        let x_offset = self.pixel_delta_u * rng.gen_range(-0.5..0.5);
        let y_offset = self.pixel_delta_v * rng.gen_range(-0.5..0.5);

        x_offset + y_offset
    }

    fn ray_color(&self, ray: &Ray, primitive: &dyn Hit, remaining_bounces: u32) -> Color {
        // if we've bounced too many times, just say the ray is black
        if remaining_bounces <= 0 {
            return Color::BLACK;
        }

        // get the hit point color if we hit something
        if let Some(ray_hit) = primitive.hit(ray, Interval::new(0.001, f64::INFINITY)) {
            let (scattered_ray, attentuation) = match ray_hit.material.scatter(&ray, &ray_hit) {
                Some(scatter) => scatter,
                None => return Color::BLACK,
            };
            return attentuation * self.ray_color(&scattered_ray, primitive, remaining_bounces - 1);
        }

        // otherwise, get the background color
        self.background_color(&ray)
    }

    fn background_color(&self, ray: &Ray) -> Color {
        let unit = ray.direction().unit_vector();
        let a = 0.5 * (unit.y + 1.0);

        let color_vec = (1.0 - a) * Vector::new(1.0, 1.0, 1.0) + a * Vector::new(0.5, 0.7, 1.0);
        Color::from_vector(&color_vec)
    }
}
