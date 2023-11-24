use std::{
    collections::VecDeque,
    f64::consts::PI,
    time::{Duration, Instant},
};

use image::ImageBuffer;
use rand::Rng;

use crate::{
    geometry::{primitives::Hit, Point, Ray, Vector},
    shading::Color,
    utils::{progress_string, Degrees, Interval},
};

#[derive(Debug, Clone, PartialEq, Default)]
pub struct Camera {
    // "public" fields
    aspect_ratio: f64,
    image_width: u32,
    samples_per_pixel: u32,
    max_bounces: u32,

    vertical_field_of_view_degrees: f64,
    look_from: Point,
    look_at: Point,
    view_up: Vector,

    defocus_angle_degrees: f64,
    focus_distance: f64,

    // private fields
    image_height: u32,
    center: Point,
    pixel_00_location: Point,
    pixel_delta_u: Vector,
    pixel_delta_v: Vector,
    u: Vector,
    v: Vector,
    w: Vector,
    defocus_disk_u: Vector,
    defocus_disk_v: Vector,

    progress_instants: VecDeque<Instant>,
}

impl Camera {
    pub fn new(
        aspect_ratio: f64,
        image_width: u32,
        samples_per_pixel: u32,
        max_bounces: u32,
        vertical_field_of_view_degrees: f64,
        look_from: Point,
        look_at: Point,
        view_up: Vector,
        defocus_angle_degrees: f64,
        focus_distance: f64,
    ) -> Self {
        Self {
            aspect_ratio,
            image_width,
            samples_per_pixel,
            max_bounces,
            vertical_field_of_view_degrees,
            look_from,
            look_at,
            view_up,
            defocus_angle_degrees,
            focus_distance,
            ..Default::default()
        }
    }

    pub fn render(&mut self, primitive: &dyn Hit) -> ImageBuffer<image::Rgba<u8>, Vec<u8>> {
        self.init();

        let mut buffer = ImageBuffer::new(self.image_width, self.image_height);
        let start = Instant::now();
        for y in 0..self.image_height {
            if y > 0 {
                println!(
                    "{}",
                    progress_string(&mut self.progress_instants, y, self.image_height, start)
                );
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

        self.center = self.look_from;

        // camera configuration
        let theta = self.vertical_field_of_view_degrees * PI / 180.0;
        let half_height = (theta / 2.0).tan();
        let viewport_height = 2.0 * half_height * self.focus_distance;
        let viewport_width = viewport_height * (self.image_width as f64 / self.image_height as f64);

        // calculate basis vectors
        self.w = self.look_at.to(&self.look_from).unit_vector();
        self.u = self.view_up.cross(&self.w).unit_vector();
        self.v = self.w.cross(&self.u);

        // viewport / pixel vectors
        let viewport_u = viewport_width * self.u;
        let viewport_v = viewport_height * -self.v;

        self.pixel_delta_u = viewport_u / self.image_width as f64;
        self.pixel_delta_v = viewport_v / self.image_height as f64;

        let viewport_upper_left =
            self.center - (self.focus_distance * self.w) - viewport_u / 2.0 - viewport_v / 2.0;

        self.pixel_00_location =
            viewport_upper_left + 0.5 * (self.pixel_delta_u + self.pixel_delta_v);

        // defocus disk
        let defocus_disk_radius =
            self.focus_distance * Degrees(self.defocus_angle_degrees / 2.0).as_radians().tan();
        self.defocus_disk_u = defocus_disk_radius * self.u;
        self.defocus_disk_v = defocus_disk_radius * self.v;
    }

    fn get_ray(&self, x: u32, y: u32) -> Ray {
        let pixel_center = self.pixel_00_location
            + (self.pixel_delta_u * x as f64)
            + (self.pixel_delta_v * y as f64);
        let pixel_sample = pixel_center + self.pixel_sample_square();

        let origin = if self.defocus_angle_degrees > 0.0 {
            self.defocus_disk_sample()
        } else {
            self.center
        };
        let direction = origin.to(&pixel_sample);

        Ray::new(origin, direction)
    }

    fn defocus_disk_sample(&self) -> Point {
        let disk_unit_vector = &Vector::random_in_unit_disk();

        self.center
            + self.defocus_disk_u * disk_unit_vector.x
            + self.defocus_disk_v * disk_unit_vector.y
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
