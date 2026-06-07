use std::{f64::consts::PI, sync::Arc};

use rand::RngExt;

use crate::{
    geometry::{Point, Ray, Vector},
    shading::{Color, materials::ScatterRecord, pdf::Pdf},
    tracing::{ImportanceSamplingConfig, RenderParameters, Scene, SceneWorld},
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
    importance_sampling: ImportanceSamplingConfig,
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

    pub fn initialize(&mut self, parameters: &RenderParameters, scene: &Scene) {
        self.center = self.eye_location;
        self.background_color = scene.background_color;
        self.importance_sampling = parameters.importance_sampling;

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
        let mut rng = rand::rng();

        let x_offset = self.pixel_delta_u * rng.random_range(-0.5..0.5);
        let y_offset = self.pixel_delta_v * rng.random_range(-0.5..0.5);

        x_offset + y_offset
    }

    pub fn ray_color(&self, mut ray: Ray, scene_world: &SceneWorld, max_bounces: u32) -> Color {
        // accumulated color contributions of each geometric we intersect along the rays' paths.
        let mut accumulated_color = Color::BLACK;
        // accumulated attentuation (color) of surfaces we encounter.
        // unless we find a dual reflective/emissive surface, this is will always deteriorate in value,
        // which represents that only a portion of the light received from that point will be reflected instead of absorbed.
        let mut attentuation_strength = Color::WHITE;

        // iterate over geometrics until we fail to intersect, reach max bounces, or find a non-reflective surface
        let mut bounces = 0;
        while let Some(ray_hit) = scene_world
            .world
            .intersect(ray, Interval::new(0.001, f64::INFINITY))
        {
            let emittance = ray_hit
                .material
                .emittance(ray_hit.u, ray_hit.v, ray_hit.point);

            // update our accumulated color
            accumulated_color += attentuation_strength * emittance;

            if bounces >= max_bounces {
                return accumulated_color;
            }

            // early termination: if the surface absorbs all light, skip scatter
            if ray_hit
                .material
                .reflectance(ray_hit.u, ray_hit.v, ray_hit.point)
                == Color::BLACK
            {
                return accumulated_color;
            }

            let Some(srec) = ray_hit.material.scatter(ray, &ray_hit) else {
                return accumulated_color;
            };

            // unit vector from surface toward the camera (outgoing direction for BRDF)
            let outgoing_direction = (-ray.direction).unit_vector();

            match srec {
                ScatterRecord::Delta { scattered } => {
                    // specular or dielectric materials, which really only have a discrete scatter direction, and not a distribution over 3D space.
                    //
                    // essentially, this is a special case that sidesteps the BRDF + PDF evaluation
                    let reflectance =
                        ray_hit
                            .material
                            .reflectance(ray_hit.u, ray_hit.v, ray_hit.point);

                    attentuation_strength *= reflectance;

                    ray = scattered
                }
                ScatterRecord::Pdf(scatter_pdf) => {
                    let pdf = build_mixture_pdf(
                        scatter_pdf,
                        &self.importance_sampling,
                        scene_world,
                        ray_hit.point,
                    );

                    let (incident_direction, index_of_strategy) = pdf.sample();

                    let cos_theta = ray_hit.normal.dot(incident_direction).max(0.0);
                    let brdf_val = ray_hit.material.brdf(
                        outgoing_direction,
                        incident_direction,
                        ray_hit.normal,
                        ray_hit.u,
                        ray_hit.v,
                        ray_hit.point,
                    );

                    if self.importance_sampling.use_multiple_importance_sampling {
                        let pdf_val = pdf.strategy_density(incident_direction, index_of_strategy);
                        let mis_weight = pdf.power_heuristic(incident_direction, index_of_strategy);

                        attentuation_strength *= brdf_val * cos_theta * mis_weight / pdf_val;
                    } else {
                        let pdf_val = pdf.density(incident_direction);

                        attentuation_strength *= brdf_val * cos_theta / pdf_val;
                    }

                    ray = Ray::new(ray_hit.point, incident_direction, ray.time)
                }
            }

            bounces += 1;
        }

        // at this point, we must have failed to intersect.
        //
        // normally, we could just return the background color.
        // however, because of a design decision I made, it is completely possible
        // to have a material be both reflective and emissive. this means we need to
        // account for cases where the accumulated_color is non-zero due to emissive
        // materials AND the ray is reflected.

        // first, update our accumulated color to account for a non-black background
        accumulated_color += attentuation_strength * self.background_color;

        // then, we can finally return the accumulated color
        accumulated_color
    }
}

/// Build a mixture PDF from the BRDF scatter PDF and any enabled importance
/// sampling categories. Skips categories with zero weight or no objects.
fn build_mixture_pdf(
    scatter_pdf: Pdf,
    config: &ImportanceSamplingConfig,
    scene_world: &SceneWorld,
    hit_point: Point,
) -> Pdf {
    let mut entries: Vec<(Pdf, f64)> = Vec::with_capacity(4);

    // material-provided BRDF category — always included as fallback;
    // zero weight means it won't be sampled unless all other
    // categories are also empty
    entries.push((scatter_pdf, config.brdf_weight));

    // emissive category
    if config.emissive_weight > 0.0 && !scene_world.emissive_list.is_empty() {
        entries.push((
            Pdf::Geometric {
                geometric: Arc::clone(&scene_world.emissive_list),
                origin: hit_point,
            },
            config.emissive_weight,
        ));
    }

    // transmissive category
    if config.transmissive_weight > 0.0 && !scene_world.transmissive_list.is_empty() {
        entries.push((
            Pdf::Geometric {
                geometric: Arc::clone(&scene_world.transmissive_list),
                origin: hit_point,
            },
            config.transmissive_weight,
        ));
    }

    // specular category
    if config.specular_weight > 0.0 && !scene_world.specular_list.is_empty() {
        entries.push((
            Pdf::Geometric {
                geometric: Arc::clone(&scene_world.specular_list),
                origin: hit_point,
            },
            config.specular_weight,
        ));
    }

    Pdf::mixture(entries)
}
