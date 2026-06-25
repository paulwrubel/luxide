use std::{f64::consts::PI, sync::Arc};

use rand::RngExt;

use crate::{
    geometry::{Point, Ray, Vector, Vector3},
    shading::{
        ColorRgb, ColorSpectrum, HeroWavelengths,
        color_spectrum::SPECTRAL_SAMPLE_COUNT,
        hero_wavelengths::HERO_WAVELENGTH_COUNT,
        materials::{ScatterRecord, SpectralScatter},
        pdf::Pdf,
    },
    tracing::{BouncesConfig, ImportanceSamplingConfig, RenderParameters, Scene, SceneWorld},
    utils::{Angle, Interval},
};

#[derive(Debug, Clone, PartialEq, Default)]
pub struct Camera {
    // "public" fields
    eye_location: Point,
    target_location: Point,
    view_up: Vector3,
    vertical_field_of_view_degrees: f64,

    defocus_angle_degrees: f64,
    focus_distance: f64,

    // "private" fields
    background_color: ColorSpectrum<SPECTRAL_SAMPLE_COUNT>,
    image_height: u32,
    center: Point,
    importance_sampling: ImportanceSamplingConfig,
    bounces: BouncesConfig,
    pixel_00_location: Point,
    pixel_delta_u: Vector3,
    pixel_delta_v: Vector3,
    u: Vector3,
    v: Vector3,
    w: Vector3,
    defocus_disk_u: Vector3,
    defocus_disk_v: Vector3,
}

impl Camera {
    pub fn new(
        vertical_field_of_view_degrees: f64,
        eye_location: Point,
        target_location: Point,
        view_up: Vector3,
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
        self.bounces = parameters.bounces;

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

    pub fn get_ray_stratified(&self, x: u32, y: u32, sample_index: u32, total_samples: u32) -> Ray {
        let pixel_center = self.pixel_00_location
            + (self.pixel_delta_u * x as f64)
            + (self.pixel_delta_v * y as f64);

        let grid_size = (total_samples as f64).sqrt().floor() as u32;
        let cell_width = 1.0 / grid_size as f64;
        let cell_height = 1.0 / grid_size as f64;

        let row = sample_index / grid_size;
        let col = sample_index % grid_size;

        let mut rng = rand::rng();

        let u = (col as f64 + rng.random_range(0.0..1.0)) * cell_width - 0.5;
        let v = (row as f64 + rng.random_range(0.0..1.0)) * cell_height - 0.5;

        let pixel_sample = pixel_center + self.pixel_delta_u * u + self.pixel_delta_v * v;

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
        let disk_unit_vector = &Vector3::random_in_unit_disk();

        self.center
            + self.defocus_disk_u * disk_unit_vector.x
            + self.defocus_disk_v * disk_unit_vector.y
    }

    fn pixel_sample_square(&self) -> Vector3 {
        let mut rng = rand::rng();

        let x_offset = self.pixel_delta_u * rng.random_range(-0.5..0.5);
        let y_offset = self.pixel_delta_v * rng.random_range(-0.5..0.5);

        x_offset + y_offset
    }

    /// Trace a ray through the scene, accumulating spectral radiance at
    /// each of the N hero wavelengths. For `N = 4`, this is the shared-
    /// geometry path. For `N = 1`, this is a single-wavelength sub-path
    /// used after a dispersive dielectric split.
    fn trace_spectral<const N: usize>(
        &self,
        mut ray: Ray,
        hw: &HeroWavelengths<N>,
        scene_world: &SceneWorld,
        mut bounces: u32,
    ) -> Vector<N> {
        let mut rng = rand::rng();

        // per-wavelength accumulated radiance
        let mut accumulated = Vector::<N>::ZERO;
        // per-wavelength attenuation throughput
        let mut attenuation = Vector::<N>::ONE;

        while let Some(ray_hit) = scene_world
            .world
            .intersect(ray, Interval::new(0.001, f64::INFINITY))
        {
            // emissive contribution at each hero wavelength
            let emittance = ray_hit
                .material
                .emittance(ray_hit.u, ray_hit.v, ray_hit.point);
            accumulated += attenuation * emittance.sample(hw);

            if bounces >= self.bounces.max {
                return accumulated;
            }

            // early termination: if surface absorbs all light at all wavelengths
            let reflectance = ray_hit
                .material
                .reflectance(ray_hit.u, ray_hit.v, ray_hit.point);
            if reflectance.is_black() {
                return accumulated;
            }

            // Build a 4-wavelength set from the generic N-wavelength `hw`.
            // For N=4 this is an identity; for N=1 this fills all 4 slots
            // with the same wavelength (non-dispersive case for sub-paths).
            let scatter_hw = {
                let mut data = [0.0; HERO_WAVELENGTH_COUNT];
                for i in 0..HERO_WAVELENGTH_COUNT {
                    data[i] = hw[i % N];
                }
                HeroWavelengths::new(data)
            };
            let Some(srec) = ray_hit.material.scatter(ray, &ray_hit, &scatter_hw) else {
                return accumulated;
            };

            let outgoing_direction = (-ray.direction).unit_vector();

            match srec {
                ScatterRecord::Spectral(ss) => {
                    let SpectralScatter { rays, reflectance } = *ss;
                    // dispersive dielectric — trace each hero wavelength independently
                    for i in 0..N {
                        if let Some(refracted) = rays[i] {
                            let single_hw = HeroWavelengths::new([hw[i]; 1]);
                            let contrib = self.trace_spectral::<1>(
                                refracted,
                                &single_hw,
                                scene_world,
                                bounces + 1,
                            );
                            accumulated[i] += attenuation[i] * reflectance[i] * contrib[0];
                        }
                    }
                    return accumulated;
                }
                ScatterRecord::Delta { scattered } => {
                    // specular — attenuation scales by reflectance at each wavelength
                    let reflectance =
                        ray_hit
                            .material
                            .reflectance(ray_hit.u, ray_hit.v, ray_hit.point);
                    attenuation *= reflectance.sample(hw);
                    ray = scattered;
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

                        if pdf_val <= 0.0 {
                            return accumulated;
                        }

                        attenuation *= brdf_val.sample(hw) * (cos_theta * mis_weight / pdf_val);
                    } else {
                        let pdf_val = pdf.density(incident_direction);

                        if pdf_val <= 0.0 {
                            return accumulated;
                        }

                        attenuation *= brdf_val.sample(hw) * (cos_theta / pdf_val);
                    }

                    ray = Ray::new(ray_hit.point, incident_direction, ray.time);
                }
            }

            bounces += 1;

            // Russian roulette: use max attenuation across all hero wavelengths
            if let Some(after) = self.bounces.use_russian_roulette_after
                && bounces > after
            {
                let p = attenuation.iter().fold(0.0_f64, |a, &b| a.max(b)).min(1.0);
                if rng.random::<f64>() > p {
                    return accumulated;
                }
                attenuation /= p;
            }
        }

        // ray missed — add background contribution
        accumulated += attenuation * self.background_color.sample(hw);

        accumulated
    }

    pub fn ray_color(&self, ray: Ray, scene_world: &SceneWorld) -> ColorRgb {
        let hw = HeroWavelengths::<HERO_WAVELENGTH_COUNT>::new_distributed();
        let accumulated = self.trace_spectral::<HERO_WAVELENGTH_COUNT>(ray, &hw, scene_world, 0);
        hw.to_color_rgb(accumulated)
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
    let mut entries: Vec<(Pdf, f64)> = Vec::with_capacity(5);

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

    // virtual category — user-defined guide geometrics for importance
    // sampling only (no visual contribution, never intersected)
    if config.virtual_weight > 0.0 && !scene_world.virtual_list.is_empty() {
        entries.push((
            Pdf::Geometric {
                geometric: Arc::clone(&scene_world.virtual_list),
                origin: hit_point,
            },
            config.virtual_weight,
        ));
    }

    Pdf::mixture(entries)
}
