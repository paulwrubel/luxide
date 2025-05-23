use serde::{Deserialize, Serialize};

#[derive(Deserialize, Debug, Clone)]
pub struct OutputFileParameters {
    pub output_dir: String,
    pub use_subdir: bool,
    pub file_basename: String,
    pub file_ext: String,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct RenderParameters {
    pub image_dimensions: (u32, u32),
    pub tile_dimensions: (u32, u32),

    pub gamma_correction: f64,
    pub samples_per_checkpoint: u32,
    pub total_checkpoints: u32,
    pub saved_checkpoint_limit: Option<u32>,
    pub max_bounces: u32,
    pub use_scaling_truncation: bool,
}
