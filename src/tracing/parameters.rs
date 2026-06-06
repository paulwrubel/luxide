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
    #[serde(default)]
    pub emissive_weight: f64,
    /// Weight for sampling toward transmissive objects (dielectric/glass).
    #[serde(default)]
    pub transmissive_weight: f64,
    /// Weight for sampling toward specular objects (metal/mirror).
    #[serde(default)]
    pub specular_weight: f64,
    /// Weight for the material's own BRDF-based PDF (diffuse/Lambertian).
    #[serde(default)]
    pub brdf_weight: f64,
}

impl ImportanceSamplingConfig {
    /// Normalize the weights so they sum to 1.0, if they don't already.
    pub fn normalize(&mut self) {
        let total = self.emissive_weight
            + self.transmissive_weight
            + self.specular_weight
            + self.brdf_weight;

        if total > 0.0 {
            self.emissive_weight /= total;
            self.transmissive_weight /= total;
            self.specular_weight /= total;
            self.brdf_weight /= total;
        }
    }

    pub fn sum(&self) -> f64 {
        self.emissive_weight + self.transmissive_weight + self.specular_weight + self.brdf_weight
    }

    pub fn validate(&self) -> Result<(), String> {
        if self.emissive_weight < 0.0
            || self.transmissive_weight < 0.0
            || self.specular_weight < 0.0
            || self.brdf_weight < 0.0
        {
            return Err("Importance sampling weights must be non-negative".to_string());
        }

        if self.sum() == 0.0 {
            return Err(
                "At least one importance sampling weight must be non-zero and positive".to_string(),
            );
        }

        Ok(())
    }
}

impl Default for ImportanceSamplingConfig {
    fn default() -> Self {
        Self {
            emissive_weight: 0.0,
            transmissive_weight: 0.0,
            specular_weight: 0.0,
            brdf_weight: 1.0,
        }
    }
}
