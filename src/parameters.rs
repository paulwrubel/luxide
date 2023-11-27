use crate::scene::Scene;

pub struct Parameters<'a, 'b> {
    pub filepath: &'a str,
    pub image_width: u32,
    pub image_height: u32,
    pub tile_width: u32,
    pub tile_height: u32,

    pub gamma_correction: f64,
    pub samples_per_pixel: u32,
    pub max_bounces: u32,

    pub use_parallel: bool,
    pub pixels_per_progress_update: u32,
    pub progress_memory: usize,

    pub scene: &'b Scene,
}
