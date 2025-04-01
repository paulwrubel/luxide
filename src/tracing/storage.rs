mod in_memory;
pub use in_memory::*;

mod postgres;
pub use postgres::*;

mod file;
pub use file::*;

use image::RgbaImage;

use serde::{Deserialize, Serialize};

use crate::{deserialization::RenderConfig, shading::Color, utils::ProgressInfo};

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
    Pausing {
        checkpoint_iteration: u32,
        progress_info: ProgressInfo,
    },
    Paused(u32), // stores the checkpoint it was paused at
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
            (RenderState::Pausing { .. }, RenderState::Pausing { .. }) => true,
            (RenderState::Paused(a), RenderState::Paused(b)) => a == b,
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

    pub fn from_image(
        render_id: RenderID,
        iteration: u32,
        image: RgbaImage,
        params: &RenderParameters,
    ) -> Self {
        let mut pixel_data = PixelData::new();
        for (x, y, pixel) in image.enumerate_pixels() {
            pixel_data.insert(
                (x, y),
                Color::from_gamma_corrected_rgba_u8(&pixel, params.gamma_correction),
            );
        }
        Self {
            render_id,
            iteration,
            pixel_data,
        }
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
    /// update progress info only if render is in Running or Pausing state
    async fn update_render_progress(
        &self,
        render_id: RenderID,
        progress_info: ProgressInfo,
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

    /// Delete a render and all its associated checkpoints
    async fn delete_render_and_checkpoints(&self, id: RenderID) -> Result<(), RenderStorageError>;

    fn get_update_progress_fn<'a>(&'a self, render_id: RenderID) -> impl AsyncFn(ProgressInfo) {
        async move |progress_info: ProgressInfo| {
            if let Err(e) = self.update_render_progress(render_id, progress_info).await {
                println!("Failed to update render state: {e}");
            }
        }
    }

    /// Find all renders that are in the Running state
    async fn find_running_renders(&self) -> Result<Vec<Render>, RenderStorageError> {
        Ok(self
            .get_all_renders()
            .await?
            .into_iter()
            .filter(|r| matches!(r.state, RenderState::Running { .. }))
            .collect())
    }

    /// Revert a render to its last checkpoint state
    async fn revert_to_last_checkpoint(&self, id: RenderID) -> Result<(), RenderStorageError> {
        let render = match self.get_render(id).await? {
            Some(r) => r,
            None => return Err(format!("Render {} not found", id)),
        };

        // get the last checkpoint from the current running state
        let last_checkpoint = match render.state {
            RenderState::Running {
                checkpoint_iteration,
                ..
            } => {
                if checkpoint_iteration > 0 {
                    Some(checkpoint_iteration - 1)
                } else {
                    None
                }
            }
            _ => return Ok(()), // not running, nothing to do
        };

        // update the render state
        match last_checkpoint {
            Some(last_cpi) => {
                // found a checkpoint, revert to that state
                self.update_render_state(id, RenderState::FinishedCheckpointIteration(last_cpi))
                    .await?
            }
            None => {
                // no checkpoints found, revert to Created state
                self.update_render_state(id, RenderState::Created).await?
            }
        }

        Ok(())
    }
}
