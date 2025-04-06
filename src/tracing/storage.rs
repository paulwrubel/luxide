mod in_memory;
use std::{
    fmt::Display,
    ops::{Deref, DerefMut},
};

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
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
    pub config: RenderConfig,
}

impl Render {
    pub fn new(id: RenderID, config: RenderConfig) -> Self {
        Self {
            id,
            state: RenderState::Created,
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
            config,
        }
    }

    pub fn mark_updated(&mut self) {
        self.updated_at = chrono::Utc::now();
    }
}

#[derive(Debug, Clone)]
pub struct RenderCheckpoint {
    pub render_id: RenderID,
    pub iteration: u32,
    pub pixel_data: PixelData,
    pub started_at: chrono::DateTime<chrono::Utc>,
    pub ended_at: chrono::DateTime<chrono::Utc>,
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
        started_at: chrono::DateTime<chrono::Utc>,
        ended_at: chrono::DateTime<chrono::Utc>,
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
            started_at,
            ended_at,
        }
    }
}

#[derive(Debug, Clone)]
pub struct RenderCheckpointMeta {
    pub render_id: RenderID,
    pub iteration: u32,
    pub started_at: chrono::DateTime<chrono::Utc>,
    pub ended_at: chrono::DateTime<chrono::Utc>,
}

impl From<RenderCheckpoint> for RenderCheckpointMeta {
    fn from(value: RenderCheckpoint) -> Self {
        Self {
            render_id: value.render_id,
            iteration: value.iteration,
            started_at: value.started_at,
            ended_at: value.ended_at,
        }
    }
}

impl From<&RenderCheckpoint> for RenderCheckpointMeta {
    fn from(value: &RenderCheckpoint) -> Self {
        Self {
            render_id: value.render_id,
            iteration: value.iteration,
            started_at: value.started_at,
            ended_at: value.ended_at,
        }
    }
}

pub struct RenderStorageError(pub String);

impl From<String> for RenderStorageError {
    fn from(error: String) -> Self {
        Self(error)
    }
}

impl From<RenderStorageError> for String {
    fn from(error: RenderStorageError) -> Self {
        error.0
    }
}

impl Display for RenderStorageError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        self.0.fmt(f)
    }
}

impl Deref for RenderStorageError {
    type Target = str;
    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl DerefMut for RenderStorageError {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.0
    }
}

#[async_trait::async_trait]
pub trait RenderStorage: Send + Sync + 'static {
    async fn get_render(&self, id: RenderID) -> Result<Option<Render>, RenderStorageError>;

    async fn render_exists(&self, id: RenderID) -> Result<bool, RenderStorageError>;

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

    async fn update_render_total_checkpoints(
        &self,
        render_id: RenderID,
        new_total_checkpoints: u32,
    ) -> Result<(), RenderStorageError>;

    async fn get_render_checkpoint(
        &self,
        render_id: RenderID,
        checkpoint: u32,
    ) -> Result<Option<RenderCheckpoint>, RenderStorageError>;

    async fn get_render_checkpoints_without_data(
        &self,
        render_id: RenderID,
    ) -> Result<Vec<RenderCheckpointMeta>, RenderStorageError>;

    async fn render_checkpoint_exists(
        &self,
        render_id: RenderID,
        checkpoint: u32,
    ) -> Result<bool, RenderStorageError>;

    async fn create_render_checkpoint(
        &self,
        render_checkpoint: RenderCheckpoint,
    ) -> Result<(), RenderStorageError>;

    /// Delete a render and all its associated checkpoints
    async fn delete_render_and_checkpoints(&self, id: RenderID) -> Result<(), RenderStorageError>;

    async fn get_next_id(&self) -> Result<RenderID, RenderStorageError>;

    async fn update_progress<'a>(&'a self, render_id: RenderID, progress_info: ProgressInfo) {
        if let Err(e) = self.update_render_progress(render_id, progress_info).await {
            println!("Failed to update render state: {}", e);
        }
    }

    /// Find all renders that are in the Running state
    async fn find_renders_in_state(
        &self,
        state: RenderState,
    ) -> Result<Vec<Render>, RenderStorageError> {
        Ok(self
            .get_all_renders()
            .await?
            .into_iter()
            .filter(|r| match (r.state, state) {
                (RenderState::Created, RenderState::Created) => true,
                (RenderState::Running { .. }, RenderState::Running { .. }) => true,
                (
                    RenderState::FinishedCheckpointIteration { .. },
                    RenderState::FinishedCheckpointIteration { .. },
                ) => true,
                (RenderState::Pausing { .. }, RenderState::Pausing { .. }) => true,
                (RenderState::Paused(_), RenderState::Paused(_)) => true,
                _ => false,
            })
            .collect())
    }

    /// Revert a render to its last checkpoint state
    async fn revert_to_last_checkpoint(&self, id: RenderID) -> Result<(), RenderStorageError> {
        {
            let render = match self.get_render(id).await? {
                Some(r) => r,
                None => return Err(format!("Render {} not found", id).into()),
            };

            // get the last checkpoint from the current running state
            match render.state {
                RenderState::Running {
                    checkpoint_iteration: cpi,
                    ..
                } => {
                    self.update_render_state(
                        id,
                        if cpi > 1 {
                            RenderState::FinishedCheckpointIteration(cpi - 1)
                        } else {
                            RenderState::Created
                        },
                    )
                    .await?;
                }
                RenderState::Pausing {
                    checkpoint_iteration: cpi,
                    ..
                } => {
                    self.update_render_state(id, RenderState::Paused(cpi - 1))
                        .await?;
                }
                _ => (), // not running or pausing, nothing to do
            };

            Ok(())
        }
    }

    async fn get_render_checkpoint_storage_usage_bytes(&self) -> Result<u64, RenderStorageError>;
}
