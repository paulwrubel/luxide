use crate::tracing::SceneWorld;
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
    pub bounces: BouncesConfig,
    pub use_scaling_truncation: bool,
    /// Configurable weights for importance sampling categories.
    /// The integrator normalizes these internally — raw values are fine.
    #[serde(default)]
    pub importance_sampling: ImportanceSamplingConfig,
}

/// Configuration for ray bounce behavior.
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct BouncesConfig {
    /// Maximum number of ray bounces before hard termination.
    pub max: u32,
    /// If set, enables Russian roulette path termination after this many
    /// bounces. Uses the max-component luminance heuristic for the
    /// survival probability. Omit or set to `None` to disable.
    pub use_russian_roulette_after: Option<u32>,
}

impl Default for BouncesConfig {
    fn default() -> Self {
        Self {
            max: 50,
            use_russian_roulette_after: None,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct ImportanceSamplingConfig {
    /// Weight for the material's own BRDF-based PDF (diffuse/Lambertian).
    #[serde(default)]
    pub brdf_weight: f64,
    /// Weight for sampling toward emissive objects (lights).
    #[serde(default)]
    pub emissive_weight: f64,
    /// Weight for sampling toward transmissive objects (dielectric/glass).
    #[serde(default)]
    pub transmissive_weight: f64,
    /// Weight for sampling toward specular objects (metal/mirror).
    #[serde(default)]
    pub specular_weight: f64,
    /// Weight for sampling toward virtual geometrics (guide objects for
    /// importance sampling only, no visual contribution).
    #[serde(default)]
    pub virtual_weight: f64,
    /// Whether to use Multiple Importance Sampling to blend
    /// BRDF and light sampling strategies (power heuristic).
    #[serde(default)]
    pub use_multiple_importance_sampling: bool,
}

impl ImportanceSamplingConfig {
    /// Normalize the weights so they sum to 1.0, if they don't already.
    pub fn normalize(&mut self) {
        let total = self.brdf_weight
            + self.emissive_weight
            + self.transmissive_weight
            + self.specular_weight
            + self.virtual_weight;

        if total > 0.0 {
            self.brdf_weight /= total;
            self.emissive_weight /= total;
            self.transmissive_weight /= total;
            self.specular_weight /= total;
            self.virtual_weight /= total;
        }
    }

    pub fn sum(&self) -> f64 {
        self.brdf_weight
            + self.emissive_weight
            + self.transmissive_weight
            + self.specular_weight
            + self.virtual_weight
    }

    pub fn validate(&self, world: &SceneWorld) -> Result<(), String> {
        if self.brdf_weight < 0.0
            || self.emissive_weight < 0.0
            || self.transmissive_weight < 0.0
            || self.specular_weight < 0.0
            || self.virtual_weight < 0.0
        {
            return Err("Importance sampling weights must be non-negative".to_string());
        }

        if self.sum() == 0.0 {
            return Err(
                "At least one importance sampling weight must be non-zero and positive".to_string(),
            );
        }

        self.validate_against_world(world)?;

        Ok(())
    }

    /// Validate that at least one non-zero weight category has matching
    /// geometric objects in the scene.
    fn validate_against_world(&self, world: &SceneWorld) -> Result<(), String> {
        // the BRDF always matches — any Lambertian material uses it
        if self.brdf_weight > 0.0 {
            return Ok(());
        }
        if self.emissive_weight > 0.0 && !world.emissive_list.is_empty() {
            return Ok(());
        }
        if self.transmissive_weight > 0.0 && !world.transmissive_list.is_empty() {
            return Ok(());
        }
        if self.specular_weight > 0.0 && !world.specular_list.is_empty() {
            return Ok(());
        }
        if self.virtual_weight > 0.0 && !world.virtual_list.is_empty() {
            return Ok(());
        }
        Err("at least one importance sampling category must have a non-zero weight with matching objects in the scene".to_string())
    }
}

impl Default for ImportanceSamplingConfig {
    fn default() -> Self {
        Self {
            brdf_weight: 1.0,
            emissive_weight: 0.0,
            transmissive_weight: 0.0,
            specular_weight: 0.0,
            virtual_weight: 0.0,
            use_multiple_importance_sampling: false,
        }
    }
}
