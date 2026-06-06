use serde::{Deserialize, Serialize};

#[derive(Deserialize, Debug, Clone)]
pub struct OutputFileParameters {
    pub output_dir: String,
    pub use_subdir: bool,
    pub file_basename: String,
    pub file_ext: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct RenderParameters {
    pub image_dimensions: (u32, u32),
    pub tile_dimensions: (u32, u32),

    pub gamma_correction: f64,
    pub samples_per_checkpoint: u32,
    pub total_checkpoints: u32,
    pub saved_checkpoint_limit: Option<u32>,
    pub max_bounces: u32,
    pub use_scaling_truncation: bool,
    /// Configurable weights for importance sampling categories.
    /// The integrator normalizes these internally — raw values are fine.
    #[serde(default)]
    pub importance_sampling: ImportanceSamplingConfig,
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct ImportanceSamplingConfig {
    /// Weight for sampling toward emissive objects (lights).
    #[serde(default = "default_weight")]
    pub emissive_weight: f64,
    /// Weight for sampling toward transmissive objects (dielectric/glass).
    #[serde(default = "default_zero")]
    pub transmissive_weight: f64,
    /// Weight for sampling toward specular objects (metal/mirror).
    #[serde(default = "default_zero")]
    pub specular_weight: f64,
    /// Weight for the material's own BRDF-based PDF (diffuse/Lambertian).
    #[serde(default = "default_weight")]
    pub brdf_weight: f64,
}

impl Default for ImportanceSamplingConfig {
    fn default() -> Self {
        Self {
            emissive_weight: 1.0,
            transmissive_weight: 0.0,
            specular_weight: 0.0,
            brdf_weight: 1.0,
        }
    }
}

fn default_weight() -> f64 {
    1.0
}

fn default_zero() -> f64 {
    0.0
}
