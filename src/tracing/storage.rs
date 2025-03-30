mod in_memory;

use image::RgbaImage;
pub use in_memory::*;

use serde::{Deserialize, Serialize};

use crate::deserialization::RenderConfig;

use super::{PixelData, RenderParameters};

pub type RenderID = u64;

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RenderState {
    Created,
    Running {
        checkpoint_iteration: u32,
        progress_percent: f64,
    },
    FinishedCheckpointIteration(u32),
}

#[derive(Clone, Serialize, Deserialize)]
pub struct Render {
    pub id: RenderID,
    pub state: RenderState,
    pub config: RenderConfig,
}

impl Render {
    pub fn new(id: RenderID, config: RenderConfig) -> Self {
        Self {
            id,
            state: RenderState::Created,
            config,
        }
    }
}

#[derive(Debug, Clone)]
pub struct RenderCheckpoint {
    pub render_id: RenderID,
    pub iteration: u32,
    pub pixel_data: PixelData,
}

impl RenderCheckpoint {
    pub fn as_image(&self, params: &RenderParameters) -> RgbaImage {
        // we have to turn our pixel_data into an image
        let (width, height) = params.image_dimensions;
        let mut img = RgbaImage::new(width, height);

        for ((x, y), color) in self.pixel_data.iter() {
            let pixel = img.get_pixel_mut(*x, *y);
            *pixel = if params.use_scaling_truncation {
                color
                    .scale_down(1.0)
                    .as_gamma_corrected_rgba_u8(1.0 / params.gamma_correction)
            } else {
                color.as_gamma_corrected_rgba_u8(1.0 / params.gamma_correction)
            }
        }

        img
    }
}

#[async_trait::async_trait]
pub trait RenderStorage: Clone + Send + Sync + 'static {
    async fn get_render(&self, id: RenderID) -> Option<Render>;
    async fn get_all_renders(&self) -> Vec<Render>;
    async fn create_render(&self, render: Render) -> Result<Render, String>;
    async fn update_render_state(&self, id: RenderID, new_state: RenderState)
    -> Result<(), String>;

    async fn create_render_checkpoint(
        &self,
        render_checkpoint: RenderCheckpoint,
    ) -> Result<(), String>;
    async fn get_render_checkpoint(
        &self,
        render_id: RenderID,
        checkpoint: u32,
    ) -> Option<RenderCheckpoint>;

    async fn get_next_id(&self) -> RenderID;
}
