use std::{collections::HashMap, sync::Arc};

use futures::StreamExt;
use tokio::sync::RwLock;

use crate::{shading::Color, utils::ProgressInfo};

use super::{
    Render, RenderCheckpoint, RenderCheckpointMeta, RenderID, RenderState, RenderStorage,
    StorageError, UserID,
};

#[derive(Clone)]
pub struct InMemoryStorage {
    renders: Arc<RwLock<HashMap<RenderID, Arc<RwLock<Render>>>>>,
    checkpoints: Arc<RwLock<Vec<RenderCheckpoint>>>,
}

impl InMemoryStorage {
    pub fn new() -> Self {
        Self {
            renders: Arc::new(RwLock::new(HashMap::new())),
            checkpoints: Arc::new(RwLock::new(Vec::new())),
        }
    }
}

#[async_trait::async_trait]
impl RenderStorage for InMemoryStorage {
    async fn get_render(&self, id: RenderID) -> Result<Option<Render>, StorageError> {
        Ok(match self.renders.read().await.get(&id) {
            Some(r) => Some(r.read().await.clone()),
            None => None,
        })
    }

    async fn render_exists(&self, id: RenderID) -> Result<bool, StorageError> {
        Ok(self.renders.read().await.contains_key(&id))
    }

    async fn render_belongs_to(&self, id: RenderID, user_id: UserID) -> Result<bool, StorageError> {
        Ok(match self.renders.read().await.get(&id) {
            Some(r) => r.read().await.user_id == user_id,
            None => false,
        })
    }

    async fn get_render_count_for_user(&self, user_id: UserID) -> Result<u32, StorageError> {
        let renders = tokio_stream::iter(self.renders.read().await.values())
            .then(async |r| r.read().await.clone())
            .collect::<Vec<Render>>()
            .await;

        Ok(renders.into_iter().filter(|r| r.user_id == user_id).count() as u32)
    }

    async fn get_all_renders(&self) -> Result<Vec<Render>, StorageError> {
        Ok(tokio_stream::iter(self.renders.read().await.values())
            .then(async |r| r.read().await.clone())
            .collect::<Vec<Render>>()
            .await)
    }

    async fn get_all_renders_for_user_id(
        &self,
        user_id: UserID,
    ) -> Result<Vec<Render>, StorageError> {
        let renders = tokio_stream::iter(self.renders.read().await.values())
            .then(async |r| r.read().await.clone())
            .collect::<Vec<Render>>()
            .await;

        Ok(renders
            .into_iter()
            .filter(|r| r.user_id == user_id)
            .collect())
    }

    async fn create_render(&self, render: Render) -> Result<Render, StorageError> {
        println!("Creating render with id: {}", render.id);
        {
            self.renders
                .write()
                .await
                .insert(render.id, Arc::new(RwLock::new(render.clone())));
        }

        Ok(render)
    }

    async fn update_render_state(
        &self,
        id: RenderID,
        new_state: RenderState,
    ) -> Result<(), StorageError> {
        // println!("Updating render state for id: {id} to {new_state:?}");

        match self.renders.write().await.get_mut(&id) {
            Some(render) => {
                let mut render = render.write().await;
                render.state = new_state;
                render.mark_updated();
                Ok(())
            }
            None => Err(format!("Render with id {id} not found").into()),
        }
    }

    async fn update_render_progress(
        &self,
        id: RenderID,
        progress_info: ProgressInfo,
    ) -> Result<(), StorageError> {
        let renders = self.renders.read().await;
        let render = match renders.get(&id) {
            Some(r) => r,
            None => return Err(format!("render {id} not found").into()),
        };

        let mut render = render.write().await;
        match render.state {
            RenderState::Running {
                checkpoint_iteration,
                ..
            } => {
                render.state = RenderState::Running {
                    checkpoint_iteration,
                    progress_info,
                };
                render.mark_updated();
                Ok(())
            }
            RenderState::Pausing {
                checkpoint_iteration,
                progress_info,
            } => {
                render.state = RenderState::Pausing {
                    checkpoint_iteration,
                    progress_info,
                };
                render.mark_updated();
                Ok(())
            }
            _ => Ok(()), // don't update progress for non-running states
        }
    }

    async fn update_render_total_checkpoints(
        &self,
        id: RenderID,
        new_total_checkpoints: u32,
    ) -> Result<(), StorageError> {
        let renders = self.renders.read().await;
        let render = match renders.get(&id) {
            Some(r) => r,
            None => return Err(format!("render {id} not found").into()),
        };

        let mut render = render.write().await;
        render.config.parameters.total_checkpoints = new_total_checkpoints;
        render.mark_updated();
        Ok(())
    }

    async fn get_render_checkpoint(
        &self,
        id: RenderID,
        iteration: u32,
    ) -> Result<Option<RenderCheckpoint>, StorageError> {
        Ok(self
            .checkpoints
            .read()
            .await
            .iter()
            .find(|c| c.render_id == id && c.iteration == iteration)
            .cloned())
    }

    async fn get_render_checkpoint_count(&self, id: RenderID) -> Result<u32, StorageError> {
        Ok(self
            .checkpoints
            .read()
            .await
            .iter()
            .filter(|c| c.render_id == id)
            .count() as u32)
    }

    async fn get_earliest_render_checkpoint_iteration(
        &self,
        id: RenderID,
    ) -> Result<Option<u32>, StorageError> {
        Ok(self
            .checkpoints
            .read()
            .await
            .iter()
            .filter(|c| c.render_id == id)
            .map(|c| c.iteration)
            .min())
    }

    async fn get_latest_render_checkpoint_iteration(
        &self,
        id: RenderID,
    ) -> Result<Option<u32>, StorageError> {
        Ok(self
            .checkpoints
            .read()
            .await
            .iter()
            .filter(|c| c.render_id == id)
            .map(|c| c.iteration)
            .max())
    }

    async fn get_render_checkpoints_without_data(
        &self,
        id: RenderID,
    ) -> Result<Vec<RenderCheckpointMeta>, StorageError> {
        Ok(self
            .checkpoints
            .read()
            .await
            .iter()
            .filter(|c| c.render_id == id)
            .map(|c| RenderCheckpointMeta::from(c))
            .collect())
    }

    async fn render_checkpoint_exists(
        &self,
        id: RenderID,
        iteration: u32,
    ) -> Result<bool, StorageError> {
        Ok(self
            .checkpoints
            .read()
            .await
            .iter()
            .any(|c| c.render_id == id && c.iteration == iteration))
    }

    async fn create_render_checkpoint(
        &self,
        render_checkpoint: RenderCheckpoint,
    ) -> Result<(), StorageError> {
        println!(
            "Creating render checkpoint {} for id: {}",
            render_checkpoint.iteration, render_checkpoint.render_id
        );
        {
            self.checkpoints.write().await.push(render_checkpoint);
        }

        Ok(())
    }

    async fn delete_render_checkpoint(
        &self,
        id: RenderID,
        checkpoint: u32,
    ) -> Result<(), StorageError> {
        let mut checkpoints = self.checkpoints.write().await;
        checkpoints.retain(|c| !(c.render_id == id && c.iteration == checkpoint));
        Ok(())
    }

    async fn delete_render_and_checkpoints(&self, id: RenderID) -> Result<(), StorageError> {
        // Remove render
        self.renders.write().await.remove(&id);

        // Remove associated checkpoints
        let mut checkpoints = self.checkpoints.write().await;
        checkpoints.retain(|c| c.render_id != id);

        Ok(())
    }

    async fn get_next_id(&self) -> Result<RenderID, StorageError> {
        Ok(match self.renders.read().await.keys().max() {
            Some(id) => id + 1,
            None => 1,
        })
    }

    async fn get_render_checkpoint_storage_usage_bytes(&self) -> Result<u64, StorageError> {
        let checkpoints = self.checkpoints.read().await;

        let key_size = std::mem::size_of::<(u32, u32)>();
        let val_size = std::mem::size_of::<Color>();

        let entry_size_bytes = (key_size + val_size) as u64;

        Ok(checkpoints
            .iter()
            .map(|c| {
                // get the bytes used to store the hashmap
                c.pixel_data.len() as u64 * entry_size_bytes
            })
            .sum())
    }
}
