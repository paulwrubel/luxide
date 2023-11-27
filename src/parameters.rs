use crate::scene::Scene;

pub struct Parameters<'a, 'b> {
    pub filepath: &'a str,
    pub image_dimensions: (u32, u32),
    pub tile_dimensions: (u32, u32),

    pub gamma_correction: f64,
    pub samples_per_pixel: u32,
    pub max_bounces: u32,

    pub use_parallel: bool,
    pub pixels_per_progress_update: u32,
    pub progress_memory: usize,

    pub scene: &'b Scene,
}
