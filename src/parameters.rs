use std::path::Path;

use crate::scene::Scene;

pub struct Parameters<'a, 'b, 'c, 'd> {
    pub output_dir: &'a Path,
    pub file_basename: &'b str,
    pub file_ext: &'c str,
    pub image_dimensions: (u32, u32),
    pub tile_dimensions: (u32, u32),

    pub gamma_correction: f64,
    pub samples_per_round: u32,
    pub round_limit: Option<u32>,
    pub max_bounces: u32,

    pub pixels_per_progress_update: u32,
    pub progress_memory: usize,

    pub scene: &'d Scene,
}
