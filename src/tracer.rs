use std::{collections::VecDeque, path::Path, time::Instant};

use image::{ImageBuffer, ImageError, Rgba};
use rayon::prelude::*;

use crate::{parameters::Parameters, shading::Color, utils};

pub struct Tracer {
    progress_instants: VecDeque<Instant>,
}

impl Tracer {
    const PROGRESS_PIXEL_BATCH_SIZE: u32 = 1000;

    pub fn new() -> Self {
        Self {
            progress_instants: VecDeque::new(),
        }
    }

    pub fn render(&mut self, parameters: &Parameters) -> Result<(), ImageError> {
        let world = &parameters.scene.world;
        let mut cam = parameters.scene.camera.clone();

        cam.initialize(parameters);

        let mut buffer = ImageBuffer::new(parameters.image_width, parameters.image_height);
        let start = Instant::now();
        let pixel_count = parameters.image_width * parameters.image_height;
        let mut current_pixel = 0;
        for (x, y, pixel) in buffer.enumerate_pixels_mut() {
            if current_pixel % Self::PROGRESS_PIXEL_BATCH_SIZE == 0 {
                println!(
                    "{}",
                    utils::progress_string(
                        &mut self.progress_instants,
                        current_pixel,
                        Self::PROGRESS_PIXEL_BATCH_SIZE,
                        pixel_count,
                        start
                    )
                );
            }

            let color = if parameters.use_parallel {
                let color = (0..parameters.samples_per_pixel).into_par_iter().fold(
                    || Color::BLACK,
                    |acc, _| {
                        let ray = cam.get_ray(x, y);
                        acc + cam.ray_color(ray, world.as_ref(), parameters.max_bounces)
                    },
                );
                color.reduce(|| Color::BLACK, |a, b| a + b)
            } else {
                let mut color = Color::BLACK;
                for _ in 0..parameters.samples_per_pixel {
                    let ray = cam.get_ray(x, y);
                    color += cam.ray_color(ray, world.as_ref(), parameters.max_bounces)
                }
                color
            };

            *pixel =
                (color / parameters.samples_per_pixel as f64).as_gamma_corrected_rgba_u8(1.0 / 2.0);

            current_pixel += 1;
        }

        self.write_to_file(&buffer, &parameters.filepath)
    }

    fn write_to_file(
        &self,
        buffer: &ImageBuffer<Rgba<u8>, Vec<u8>>,
        filepath: &str,
    ) -> Result<(), ImageError> {
        buffer.save(&Path::new(filepath))
    }
}
