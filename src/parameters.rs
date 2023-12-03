#[derive(serde::Deserialize)]
pub struct Parameters {
    pub output_dir: String,
    pub use_subdir: bool,
    pub file_basename: String,
    pub file_ext: String,
    pub image_dimensions: (u32, u32),
    pub tile_dimensions: (u32, u32),

    pub gamma_correction: f64,
    pub samples_per_round: u32,
    pub round_limit: Option<u32>,
    pub max_bounces: u32,
    pub use_scaling_truncation: bool,

    pub pixels_per_progress_update: u32,
    pub progress_memory: usize,
}
