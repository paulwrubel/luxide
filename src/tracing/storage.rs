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
    pub user_id: UserID,
}

impl Render {
    pub fn new(id: RenderID, config: RenderConfig, user_id: UserID) -> Self {
        Self {
            id,
            state: RenderState::Created,
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
            config,
            user_id,
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

pub struct StorageError(pub String);

impl From<String> for StorageError {
    fn from(error: String) -> Self {
        Self(error)
    }
}

impl From<StorageError> for String {
    fn from(error: StorageError) -> Self {
        error.0
    }
}

impl Display for StorageError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        self.0.fmt(f)
    }
}

impl Deref for StorageError {
    type Target = str;
    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl DerefMut for StorageError {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.0
    }
}

#[async_trait::async_trait]
pub trait RenderStorage: Send + Sync + 'static {
    async fn get_render(&self, id: RenderID) -> Result<Option<Render>, StorageError>;

    async fn render_exists(&self, id: RenderID) -> Result<bool, StorageError>;

    async fn render_belongs_to(&self, id: RenderID, user_id: UserID) -> Result<bool, StorageError>;

    async fn get_render_count_for_user(&self, user_id: UserID) -> Result<u32, StorageError>;

    async fn get_all_renders(&self) -> Result<Vec<Render>, StorageError>;

    async fn get_all_renders_for_user_id(
        &self,
        user_id: UserID,
    ) -> Result<Vec<Render>, StorageError>;

    async fn create_render(&self, render: Render) -> Result<Render, StorageError>;

    async fn update_render_state(
        &self,
        id: RenderID,
        new_state: RenderState,
    ) -> Result<(), StorageError>;

    /// update progress info only if render is in Running or Pausing state
    async fn update_render_progress(
        &self,
        render_id: RenderID,
        progress_info: ProgressInfo,
    ) -> Result<(), StorageError>;

    async fn update_render_total_checkpoints(
        &self,
        render_id: RenderID,
        new_total_checkpoints: u32,
    ) -> Result<(), StorageError>;

    async fn get_render_checkpoint(
        &self,
        render_id: RenderID,
        checkpoint: u32,
    ) -> Result<Option<RenderCheckpoint>, StorageError>;

    async fn get_most_recent_render_checkpoint_iteration(
        &self,
        render_id: RenderID,
    ) -> Result<Option<u32>, StorageError>;

    async fn get_render_checkpoints_without_data(
        &self,
        render_id: RenderID,
    ) -> Result<Vec<RenderCheckpointMeta>, StorageError>;

    async fn render_checkpoint_exists(
        &self,
        render_id: RenderID,
        checkpoint: u32,
    ) -> Result<bool, StorageError>;

    async fn create_render_checkpoint(
        &self,
        render_checkpoint: RenderCheckpoint,
    ) -> Result<(), StorageError>;

    /// Delete a render and all its associated checkpoints
    async fn delete_render_and_checkpoints(&self, id: RenderID) -> Result<(), StorageError>;

    async fn get_next_id(&self) -> Result<RenderID, StorageError>;

    async fn update_progress<'a>(&'a self, render_id: RenderID, progress_info: ProgressInfo) {
        if let Err(e) = self.update_render_progress(render_id, progress_info).await {
            println!("Failed to update render state: {}", e);
        }
    }

    /// Find all renders that are in the Running state
    async fn find_renders_in_state(&self, state: RenderState) -> Result<Vec<Render>, StorageError> {
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
    async fn revert_to_last_checkpoint(&self, id: RenderID) -> Result<(), StorageError> {
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

    async fn get_render_checkpoint_storage_usage_bytes(&self) -> Result<u64, StorageError>;
}

pub type UserID = u32;
pub type GithubID = i64;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct User {
    pub id: UserID,
    pub github_id: GithubID,
    pub username: String,
    pub avatar_url: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
    pub role: Role,
    pub max_renders: Option<u32>,
    pub max_checkpoints: Option<u32>,
    pub max_render_pixel_count: Option<u32>,
}

impl User {
    pub fn new_admin(
        id: UserID,
        github_id: GithubID,
        username: String,
        avatar_url: String,
    ) -> Self {
        Self {
            id,
            github_id,
            username,
            avatar_url,
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
            role: Role::Admin,
            max_renders: None,
            max_checkpoints: None,
            max_render_pixel_count: None,
        }
    }

    pub fn new(id: UserID, github_id: GithubID, username: String, avatar_url: String) -> Self {
        Self {
            id,
            github_id,
            username,
            avatar_url,
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
            role: Role::User,
            max_renders: Some(1),
            max_checkpoints: Some(10),
            max_render_pixel_count: Some(250_000),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Role {
    Admin,
    User,
}

impl Default for Role {
    fn default() -> Self {
        Self::User
    }
}

impl Display for Role {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Role::Admin => write!(f, "admin"),
            Role::User => write!(f, "user"),
        }
    }
}

impl From<String> for Role {
    fn from(value: String) -> Self {
        match value.as_str() {
            "admin" => Self::Admin,
            "user" => Self::User,
            _ => Self::User,
        }
    }
}

impl From<Role> for String {
    fn from(value: Role) -> Self {
        match value {
            Role::Admin => "admin".to_string(),
            Role::User => "user".to_string(),
        }
    }
}

#[async_trait::async_trait]
pub trait UserStorage: Send + Sync + 'static {
    async fn get_user(&self, id: UserID) -> Result<Option<User>, StorageError>;

    async fn get_user_by_github_id(
        &self,
        github_id: GithubID,
    ) -> Result<Option<User>, StorageError>;

    async fn user_exists(&self, id: UserID) -> Result<bool, StorageError>;

    async fn user_exists_by_github_id(&self, github_id: GithubID) -> Result<bool, StorageError>;

    async fn create_user(&self, user: User) -> Result<User, StorageError>;

    async fn update_user(&self, user: User) -> Result<User, StorageError>;

    async fn delete_user(&self, id: UserID) -> Result<(), StorageError>;

    async fn get_next_user_id(&self) -> Result<UserID, StorageError>;
}
