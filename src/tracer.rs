use std::{collections::VecDeque, path::Path, sync::mpsc, thread, time::Instant};

use image::{ImageBuffer, ImageError, RgbaImage};
use rayon::prelude::*;

use crate::{parameters::Parameters, shading::Color, utils};

pub struct Tracer {
    thread_pool: rayon::ThreadPool,
}

impl Tracer {
    pub fn new(thread_count: usize) -> Self {
        Self {
            thread_pool: rayon::ThreadPoolBuilder::new()
                .num_threads(thread_count)
                .build()
                .unwrap(),
        }
    }

    pub fn render(&mut self, parameters: &Parameters) -> Result<(), ImageError> {
        let image_buffer = self
            .thread_pool
            .install(|| self.parallel_render(parameters));
        self.write_to_file(&image_buffer, &parameters.filepath)
    }

    fn parallel_render(&self, parameters: &Parameters) -> RgbaImage {
        let world = &parameters.scene.world;
        let mut cam = parameters.scene.camera.clone();
        let (width, height) = parameters.image_dimensions;

        cam.initialize(parameters);

        // let start = Instant::now();
        // let pixel_count = parameters.image_width * parameters.image_height;
        // let mut current_pixel = 0;

        let tiles = Tiles::new(parameters.image_dimensions, parameters.tile_dimensions);

        let (sender, receiver) = mpsc::channel();

        let start: Instant = Instant::now();
        let total = width * height;
        let batch_size = parameters.pixels_per_progress_update;
        let memory = parameters.progress_memory;
        let progress_handle = thread::spawn(move || {
            let mut instants: VecDeque<Instant> = VecDeque::new();
            let mut current = 0;
            for (_x, _y) in receiver {
                if current % batch_size == 0 {
                    let progress_string = utils::progress_string(
                        &mut instants,
                        current,
                        batch_size,
                        total,
                        start,
                        memory,
                    );
                    println!("{}", progress_string);
                }
                current += 1;
            }
        });

        let colors: Vec<(u32, u32, Color)> = tiles
            .par_bridge()
            .flat_map(|tile| {
                let tile_colors: Vec<(u32, u32, Color)> = tile
                    .par_bridge()
                    .map(|(x, y)| {
                        let color = (0..parameters.samples_per_pixel)
                            .into_par_iter()
                            .fold(
                                || Color::BLACK,
                                |acc, _| {
                                    let ray = cam.get_ray(x, y);
                                    acc + cam.ray_color(ray, world.as_ref(), parameters.max_bounces)
                                },
                            )
                            .reduce(|| Color::BLACK, |a, b| a + b);

                        // done with pixel!
                        sender.send((x, y)).unwrap();

                        (x, y, color / parameters.samples_per_pixel as f64)
                    })
                    .collect();

                // done with tile!

                tile_colors
            })
            .collect();

        drop(sender);
        progress_handle.join().unwrap();

        let mut buffer = ImageBuffer::new(width, height);
        for (x, y, color) in colors {
            let pixel = buffer.get_pixel_mut(x, y);
            *pixel = color.as_gamma_corrected_rgba_u8(1.0 / parameters.gamma_correction);
        }

        buffer
    }

    fn write_to_file(&self, buffer: &RgbaImage, filepath: &str) -> Result<(), ImageError> {
        buffer.save(&Path::new(filepath))
    }
}

struct Tiles {
    image_dimensions: (u32, u32),
    tile_dimensions: (u32, u32),

    current_origin: (u32, u32),
}

impl Tiles {
    pub fn new(image_dimensions: (u32, u32), tile_dimensions: (u32, u32)) -> Self {
        Self {
            image_dimensions,
            tile_dimensions,
            current_origin: (0, 0),
        }
    }
}

impl Iterator for Tiles {
    type Item = Tile;

    fn next(&mut self) -> Option<Self::Item> {
        if self.current_origin.0 >= self.image_dimensions.0 {
            self.current_origin.0 = 0;
            self.current_origin.1 += self.tile_dimensions.1;
        }

        if self.current_origin.1 >= self.image_dimensions.1 {
            return None;
        }

        let this_origin = self.current_origin;

        self.current_origin.0 += self.tile_dimensions.0;

        let (width, height) = self.tile_dimensions;
        Some(Tile::new(
            this_origin,
            (
                width.min(self.image_dimensions.0 - this_origin.0),
                height.min(self.image_dimensions.1 - this_origin.1),
            ),
        ))
    }
}

struct Tile {
    origin: (u32, u32),
    dimensions: (u32, u32),

    current: (u32, u32),
}

impl Tile {
    pub fn new(origin: (u32, u32), dimensions: (u32, u32)) -> Self {
        Self {
            origin,
            dimensions,
            current: origin,
        }
    }
}

impl Iterator for Tile {
    type Item = (u32, u32);

    fn next(&mut self) -> Option<Self::Item> {
        if self.current.0 >= self.origin.0 + self.dimensions.0 {
            self.current.0 = self.origin.0;
            self.current.1 += 1;
        }

        if self.current.1 >= self.origin.1 + self.dimensions.1 {
            return None;
        }

        let location = self.current;

        self.current.0 += 1;

        Some(location)
    }
}
