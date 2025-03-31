mod in_memory;
pub use in_memory::*;

mod postgres;
pub use postgres::*;

use image::RgbaImage;

use serde::{Deserialize, Serialize};

use crate::{deserialization::RenderConfig, utils::ProgressInfo};

use super::{PixelData, RenderParameters};

pub type RenderID = u32;

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RenderState {
    Created,
    Running {
        checkpoint_iteration: u32,
        progress_info: ProgressInfo,
    },
    FinishedCheckpointIteration(u32),
}

impl PartialEq for RenderState {
    fn eq(&self, other: &Self) -> bool {
        match (self, other) {
            (RenderState::Created, RenderState::Created) => true,
            (RenderState::Running { .. }, RenderState::Running { .. }) => true,
            (
                RenderState::FinishedCheckpointIteration(a),
                RenderState::FinishedCheckpointIteration(b),
            ) => a == b,
            _ => false,
        }
    }
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

pub type RenderStorageError = String;

#[async_trait::async_trait]
pub trait RenderStorage: Clone + Send + Sync + 'static {
    async fn get_render(&self, id: RenderID) -> Result<Option<Render>, RenderStorageError>;
    async fn get_all_renders(&self) -> Result<Vec<Render>, RenderStorageError>;
    async fn create_render(&self, render: Render) -> Result<Render, RenderStorageError>;
    async fn update_render_state(
        &self,
        id: RenderID,
        new_state: RenderState,
    ) -> Result<(), RenderStorageError>;

    async fn create_render_checkpoint(
        &self,
        render_checkpoint: RenderCheckpoint,
    ) -> Result<(), String>;
    async fn get_render_checkpoint(
        &self,
        render_id: RenderID,
        checkpoint: u32,
    ) -> Result<Option<RenderCheckpoint>, RenderStorageError>;

    async fn get_next_id(&self) -> Result<RenderID, RenderStorageError>;

    fn get_update_progress_fn<'a>(
        &'a self,
        render_id: RenderID,
        checkpoint_iteration: u32,
    ) -> impl AsyncFn(ProgressInfo) {
        async move |progress_info: ProgressInfo| {
            match self
                .update_render_state(
                    render_id,
                    RenderState::Running {
                        checkpoint_iteration,
                        progress_info,
                    },
                )
                .await
            {
                Ok(()) => {}
                Err(e) => {
                    println!("Failed to update render state: {e}");
                }
            };
        }
    }
}
