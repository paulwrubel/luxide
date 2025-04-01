use std::{collections::HashMap, num::NonZeroUsize, sync::mpsc, thread};

use rand::seq::SliceRandom;
use rayon::prelude::*;

use crate::{deserialization::RenderData, shading::Color};

pub type PixelData = HashMap<(u32, u32), Color>;

#[derive(Debug, Copy, Clone)]
pub struct ProgressPacket {
    pub coords: (u32, u32),
}

pub struct Tracer {
    thread_pool: rayon::ThreadPool,
}

impl Tracer {
    pub fn new(threads: Threads) -> Self {
        Self {
            thread_pool: rayon::ThreadPoolBuilder::new()
                .num_threads(threads.effective_count())
                .build()
                .unwrap(),
        }
    }

    // pub fn render(
    //     &mut self,
    //     render_data: &RenderData,
    //     // output: impl CheckpointDestination,
    //     // progress_recv: mpsc::Receiver<f64>,
    //     indentation: usize,
    // ) -> Result<(), String> {
    //     let total_checkpoints = render_data.parameters.checkpoints;

    //     let mut pixel_data = PixelData::new();
    //     let mut checkpoint = 1;

    //     // let now = OffsetDateTime::now_utc();
    //     // let formatted_timestamp = utils::get_formatted_timestamp_for(now);
    //     // let output_dir = format!(
    //     //     "{}/{}_{}",
    //     //     parameters.output_dir, scene.name, formatted_timestamp
    //     // );
    //     // println!("Initializing output directory: {output_dir}");
    //     // fs::create_dir_all(&output_dir).map_err(|err| err.to_string())?;

    //     loop {
    //         let checkpoint_limit_string = format!("/{}", render_data.parameters.checkpoints);

    //         println!(
    //             "{}Rendering round {}{}...",
    //             " ".repeat(indentation),
    //             checkpoint,
    //             checkpoint_limit_string
    //         );

    //         self.render_to_checkpoint_iteration(
    //             checkpoint,
    //             &mut pixel_data,
    //             render_data,
    //             indentation + 2,
    //         );

    //         // println!(
    //         //     "{}Writing round {} data to file...",
    //         //     " ".repeat(indentation),
    //         //     round
    //         // );
    //         // self.write_to_file(
    //         //     &round_img_buffer,
    //         //     round,
    //         //     parameters,
    //         //     &output_dir,
    //         //     indentation,
    //         // )?;

    //         if total_checkpoints == checkpoint {
    //             break;
    //         }

    //         checkpoint += 1;
    //     }
    //     Ok(())
    // }

    pub fn render_to_checkpoint_iteration<'a>(
        &'a self,
        checkpoint: u32,
        pixel_data: &'a mut PixelData,
        render_data: &RenderData,
        progress_sender: mpsc::Sender<ProgressPacket>,
        // indentation: usize,
    ) {
        self.thread_pool.install(|| {
            // self.parallel_render_round(checkpoint, pixel_data, render_data, indentation)
            self.parallel_render_round(checkpoint, pixel_data, render_data, progress_sender)
        });

        // println!("{}Writing data to image buffer...", " ".repeat(indentation));
        // let (width, height) = parameters.image_dimensions;
        // let mut buffer = ImageBuffer::new(width, height);
        // for ((x, y), color) in pixel_data {
        //     let pixel = buffer.get_pixel_mut(*x, *y);
        //     *pixel = if parameters.use_scaling_truncation {
        //         color
        //             .scale_down(1.0)
        //             .as_gamma_corrected_rgba_u8(1.0 / parameters.gamma_correction)
        //     } else {
        //         color.as_gamma_corrected_rgba_u8(1.0 / parameters.gamma_correction)
        //     }
        // }

        // buffer

        // pixel_data
    }

    fn parallel_render_round(
        &self,
        checkpoint: u32,
        pixel_data: &mut PixelData,
        render_data: &RenderData,
        progress_sender: mpsc::Sender<ProgressPacket>,
        // indentation: usize,
    ) {
        let RenderData { parameters, scene } = render_data;

        let world = &scene.world;
        let mut cam = scene.camera.clone();
        // let (width, height) = parameters.image_dimensions;

        // println!("{}Initializing camera...", " ".repeat(indentation));
        cam.initialize(parameters, scene);

        // let start = Instant::now();
        // let pixel_count = parameters.image_width * parameters.image_height;
        // let mut current_pixel = 0;

        // println!("{}Starting progress worker...", " ".repeat(indentation));
        // let (sender, receivers) = mpsc::channel();

        // let start: Instant = Instant::now();
        // let total = width * height;
        // let batch_size = 100;
        // let memory = 50;
        // let progress_handle = thread::spawn(move || {
        //     let mut instants: VecDeque<Instant> = VecDeque::new();
        //     let mut current = 0;
        //     for (_round, (_x, _y)) in receiver {
        //         current += 1;
        //         if current % batch_size == 0 || current == total {
        //             let progress_string = utils::progress_string(
        //                 &mut instants,
        //                 current,
        //                 batch_size,
        //                 total,
        //                 start,
        //                 memory,
        //             );
        //             print!(
        //                 "\r{}{}{}",
        //                 " ".repeat(indentation),
        //                 progress_string,
        //                 " ".repeat(10)
        //             );
        //             stdout().flush().unwrap();
        //         }
        //     }
        // });

        let tiles = Tiles::new(parameters.image_dimensions, parameters.tile_dimensions);

        let mut rng = rand::thread_rng();

        let mut tiles = tiles.collect::<Vec<Tile>>();
        tiles.shuffle(&mut rng);
        let tiles = tiles.par_iter();

        let colors: HashMap<(u32, u32), Color> = tiles
            .flat_map(|tile| {
                let tile_colors: HashMap<(u32, u32), Color> = tile
                    .map(|(x, y)| {
                        let color =
                            (0..parameters.samples_per_checkpoint).fold(Color::BLACK, |acc, _| {
                                let ray = cam.get_ray(x, y);
                                acc + cam.ray_color(ray, world.as_ref(), parameters.max_bounces)
                            });
                        // done with pixel!

                        // send progress
                        progress_sender
                            .send(ProgressPacket { coords: (x, y) })
                            .unwrap();

                        // average samples together
                        let scaled_color = color / parameters.samples_per_checkpoint as f64;

                        // scale relative to the current round
                        let img_color = pixel_data.get(&(x, y)).unwrap_or(&Color::BLACK);
                        let weighted_color = (img_color * (checkpoint - 1) as f64 + scaled_color)
                            / checkpoint as f64;

                        // send final pixel color
                        ((x, y), weighted_color)
                    })
                    .collect();

                // done with tile!

                tile_colors
            })
            .collect();

        for ((x, y), color) in colors {
            pixel_data.insert((x, y), color);
        }
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

#[derive(Debug, Clone, Copy)]
pub enum Threads {
    Count(NonZeroUsize),
    AllWithDefault(NonZeroUsize),
}

impl Threads {
    pub fn effective_count(&self) -> usize {
        match self {
            Threads::Count(count) => (*count).get(),
            Threads::AllWithDefault(default) => {
                thread::available_parallelism().unwrap_or(*default).get()
            }
        }
    }
}
