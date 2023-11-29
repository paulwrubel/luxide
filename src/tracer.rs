use std::{
    collections::{HashMap, VecDeque},
    fs,
    io::{self, stdout, Write},
    path::Path,
    sync::mpsc,
    thread,
    time::Instant,
};

use image::{ImageBuffer, RgbaImage};
use rand::seq::SliceRandom;
use rayon::prelude::*;
use time::{macros::format_description, OffsetDateTime, UtcOffset};

use crate::{parameters::Parameters, shading::Color, utils};

pub struct Tracer {
    thread_pool: rayon::ThreadPool,
    local_utc_offset: UtcOffset,
}

impl Tracer {
    pub fn new(thread_count: usize, local_utc_offset: UtcOffset) -> Self {
        Self {
            thread_pool: rayon::ThreadPoolBuilder::new()
                .num_threads(thread_count)
                .build()
                .unwrap(),
            local_utc_offset,
        }
    }

    pub fn render(&mut self, parameters: &Parameters, indentation: usize) -> Result<(), String> {
        let mut img_data = HashMap::new();
        let mut round = 1;
        loop {
            let round_limit_string = match parameters.round_limit {
                Some(limit) => format!("/{}", limit),
                None => String::new(),
            };

            println!(
                "{}Rendering round {}{}...",
                " ".repeat(indentation),
                round,
                round_limit_string
            );

            let round_img_buffer =
                self.render_round(round, &mut img_data, parameters, indentation + 2);

            println!(
                "{}Writing round {} data to file...",
                " ".repeat(indentation),
                round
            );
            self.write_to_file(&round_img_buffer, round, parameters, indentation)?;

            if let Some(limit) = parameters.round_limit {
                if limit == round {
                    break;
                }
            }
            round += 1;
        }
        Ok(())
    }

    fn render_round(
        &self,
        round: u32,
        img_data: &mut HashMap<(u32, u32), Color>,
        parameters: &Parameters,
        indentation: usize,
    ) -> RgbaImage {
        // get self as immutable reference

        self.thread_pool
            .install(|| self.parallel_render_round(round, img_data, parameters, indentation));

        println!("{}Writing data to image buffer...", " ".repeat(indentation));
        let (width, height) = parameters.image_dimensions;
        let mut buffer = ImageBuffer::new(width, height);
        for ((x, y), color) in img_data {
            let pixel = buffer.get_pixel_mut(*x, *y);
            *pixel = color.as_gamma_corrected_rgba_u8(1.0 / parameters.gamma_correction);
        }

        buffer
    }

    fn parallel_render_round(
        &self,
        round: u32,
        img_data: &mut HashMap<(u32, u32), Color>,
        parameters: &Parameters,
        indentation: usize,
    ) {
        let world = &parameters.scene.world;
        let mut cam = parameters.scene.camera.clone();
        let (width, height) = parameters.image_dimensions;

        println!("{}Initializing camera...", " ".repeat(indentation));
        cam.initialize(parameters);

        // let start = Instant::now();
        // let pixel_count = parameters.image_width * parameters.image_height;
        // let mut current_pixel = 0;

        println!("{}Starting progress worker...", " ".repeat(indentation));
        let (sender, receiver) = mpsc::channel();

        let start: Instant = Instant::now();
        let total = width * height;
        let batch_size = parameters.pixels_per_progress_update;
        let memory = parameters.progress_memory;
        let progress_handle = thread::spawn(move || {
            let mut instants: VecDeque<Instant> = VecDeque::new();
            let mut current = 0;
            for (_round, (_x, _y)) in receiver {
                current += 1;
                if current % batch_size == 0 || current == total {
                    let progress_string = utils::progress_string(
                        &mut instants,
                        current,
                        batch_size,
                        total,
                        start,
                        memory,
                    );
                    print!(
                        "\r{}{}{}",
                        " ".repeat(indentation),
                        progress_string,
                        " ".repeat(10)
                    );
                    stdout().flush().unwrap();
                }
            }
        });

        println!("{}Creating tiles...", " ".repeat(indentation));
        let tiles = Tiles::new(parameters.image_dimensions, parameters.tile_dimensions);

        let mut rng = rand::thread_rng();

        println!("{}Preparing tiles...", " ".repeat(indentation));
        let mut tiles = tiles.collect::<Vec<Tile>>();
        tiles.shuffle(&mut rng);
        let tiles = tiles.par_iter();

        println!("{}Rendering tiles...", " ".repeat(indentation));
        let colors: HashMap<(u32, u32), Color> = tiles
            .flat_map(|tile| {
                let tile_colors: HashMap<(u32, u32), Color> = tile
                    .map(|(x, y)| {
                        let color =
                            (0..parameters.samples_per_round).fold(Color::BLACK, |acc, _| {
                                let ray = cam.get_ray(x, y);
                                acc + cam.ray_color(ray, world.as_ref(), parameters.max_bounces)
                            });
                        // done with pixel!

                        // send progress
                        sender.send((round, (x, y))).unwrap();

                        // average samples together
                        let scaled_color = color / parameters.samples_per_round as f64;

                        // scale relative to the current round
                        let img_color = img_data.get(&(x, y)).unwrap_or(&Color::BLACK);
                        let weighted_color =
                            (img_color * (round - 1) as f64 + scaled_color) / round as f64;

                        // send final pixel color
                        ((x, y), weighted_color)
                    })
                    .collect();

                // done with tile!

                tile_colors
            })
            .collect();

        for ((x, y), color) in colors {
            img_data.insert((x, y), color);
        }

        drop(sender);
        progress_handle.join().unwrap();
        println!("");
    }

    fn write_to_file(
        &self,
        buffer: &RgbaImage,
        round: u32,
        p: &Parameters,
        indentation: usize,
    ) -> Result<(), String> {
        let filepath = match Self::get_final_image_path(
            round * p.samples_per_round,
            p.output_dir,
            p.file_basename,
            p.file_ext,
            self.local_utc_offset,
            indentation,
        ) {
            Ok(filepath) => Ok(filepath),
            Err(e) => Err(e.to_string()),
        }?;
        println!(
            "{}Saving image buffer to {filepath}...",
            " ".repeat(indentation)
        );
        match buffer.save(filepath) {
            Ok(_) => Ok(()),
            Err(e) => Err(e.to_string()),
        }
    }

    fn get_final_image_path(
        total_samples: u32,
        output_dir: &Path,
        file_basename: &str,
        file_ext: &str,
        local_offset: time::UtcOffset,
        indentation: usize,
    ) -> Result<String, io::Error> {
        println!("{}Determining output filename...", " ".repeat(indentation));
        fs::create_dir_all(output_dir)?;
        let now = OffsetDateTime::now_utc().to_offset(local_offset);
        let formatted_timestamp = utils::get_formatted_timestamp_for(now);
        let filepath = format!(
            "{}/{file_basename}_{total_samples}s_{}.{file_ext}",
            output_dir.display(),
            formatted_timestamp
        );
        Ok(filepath)
    }
}

#[derive(Debug, Clone, Copy)]
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

#[derive(Debug, Clone, Copy)]
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
