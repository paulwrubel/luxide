use std::f64::consts::PI;

use rand::Rng;

use crate::{
    geometry::{Geometric, Point, Ray, Vector},
    parameters::Parameters,
    scene::Scene,
    shading::Color,
    utils::{Angle, Interval},
};

#[derive(Debug, Clone, PartialEq, Default)]
pub struct Camera {
    // "public" fields
    eye_location: Point,
    target_location: Point,
    view_up: Vector,
    vertical_field_of_view_degrees: f64,

    defocus_angle_degrees: f64,
    focus_distance: f64,

    // "private" fields
    background_color: Color,
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
}

impl Camera {
    pub fn new(
        vertical_field_of_view_degrees: f64,
        eye_location: Point,
        target_location: Point,
        view_up: Vector,
        defocus_angle_degrees: f64,
        focus_distance: f64,
    ) -> Self {
        Self {
            vertical_field_of_view_degrees,
            eye_location,
            target_location,
            view_up,
            defocus_angle_degrees,
            focus_distance,
            ..Default::default()
        }
    }

    pub fn initialize(&mut self, parameters: &Parameters, scene: &Scene) {
        self.center = self.eye_location;
        self.background_color = scene.background_color;

        let (width, height) = parameters.image_dimensions;

        // camera configuration
        let theta = self.vertical_field_of_view_degrees * PI / 180.0;
        let half_height = (theta / 2.0).tan();
        let viewport_height = 2.0 * half_height * self.focus_distance;
        let viewport_width = viewport_height * (width as f64 / height as f64);

        // calculate basis vectors
        self.w = self.target_location.to(self.eye_location).unit_vector();
        self.u = self.view_up.cross(self.w).unit_vector();
        self.v = self.w.cross(self.u);

        // viewport / pixel vectors
        let viewport_u = viewport_width * self.u;
        let viewport_v = viewport_height * -self.v;

        self.pixel_delta_u = viewport_u / width as f64;
        self.pixel_delta_v = viewport_v / height as f64;

        let viewport_upper_left =
            self.center - (self.focus_distance * self.w) - viewport_u / 2.0 - viewport_v / 2.0;

        self.pixel_00_location =
            viewport_upper_left + 0.5 * (self.pixel_delta_u + self.pixel_delta_v);

        // defocus disk
        let defocus_disk_radius = self.focus_distance
            * Angle::Degrees(self.defocus_angle_degrees / 2.0)
                .as_radians()
                .tan();
        self.defocus_disk_u = defocus_disk_radius * self.u;
        self.defocus_disk_v = defocus_disk_radius * self.v;
    }

    pub fn get_ray(&self, x: u32, y: u32) -> Ray {
        let pixel_center = self.pixel_00_location
            + (self.pixel_delta_u * x as f64)
            + (self.pixel_delta_v * y as f64);
        let pixel_sample = pixel_center + self.pixel_sample_square();

        let origin = if self.defocus_angle_degrees > 0.0 {
            self.defocus_disk_sample()
        } else {
            self.center
        };
        let direction = origin.to(pixel_sample);
        let time = rand::random();

        Ray::new(origin, direction, time)
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

    pub fn ray_color(&self, ray: Ray, geometric: &dyn Geometric, remaining_bounces: u32) -> Color {
        // if we've bounced too many times, just say the ray is black
        if remaining_bounces <= 0 {
            return Color::BLACK;
        }

        // get the hit point color if we hit something
        if let Some(ray_hit) = geometric.intersect(ray, Interval::new(0.001, f64::INFINITY)) {
            let emittance = ray_hit
                .material
                .emittance(ray_hit.u, ray_hit.v, ray_hit.point);

            let reflectance = ray_hit
                .material
                .reflectance(ray_hit.u, ray_hit.v, ray_hit.point);

            // if the surface is black, it's not going to let any incoming light contribute to the outgoing color
            // so we can safely say no light is reflected and simply return the emittance of the material
            if reflectance == Color::BLACK {
                return emittance;
            }

            // get scattered ray, if possible
            let scattered_ray = match ray_hit.material.scatter(ray, &ray_hit) {
                Some(scatter) => scatter,
                None => {
                    // return just emitted light, since we didn't scatter
                    return emittance;
                }
            };
            let scattered_color = self.ray_color(scattered_ray, geometric, remaining_bounces - 1);

            emittance + reflectance * scattered_color
        } else {
            // otherwise, get the background color
            self.background_color
        }
    }
}
