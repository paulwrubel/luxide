use std::{collections::HashMap, sync::Arc};

use futures::StreamExt;
use tokio::sync::RwLock;

use crate::utils::ProgressInfo;

use super::{
    AsyncProgressFn, Render, RenderCheckpoint, RenderID, RenderState, RenderStorage,
    RenderStorageError,
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
    async fn get_render(&self, id: RenderID) -> Result<Option<Render>, RenderStorageError> {
        Ok(match self.renders.read().await.get(&id) {
            Some(r) => Some(r.read().await.clone()),
            None => None,
        })
    }

    async fn get_all_renders(&self) -> Result<Vec<Render>, RenderStorageError> {
        Ok(tokio_stream::iter(self.renders.read().await.values())
            .then(async |r| r.read().await.clone())
            .collect::<Vec<Render>>()
            .await)
    }

    async fn create_render(&self, render: Render) -> Result<Render, RenderStorageError> {
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
    ) -> Result<(), RenderStorageError> {
        // println!("Updating render state for id: {id} to {new_state:?}");

        match self.renders.write().await.get_mut(&id) {
            Some(render) => {
                render.write().await.state = new_state;
                Ok(())
            }
            None => Err(format!("Render with id {id} not found")),
        }
    }

    async fn update_render_progress(
        &self,
        render_id: RenderID,
        progress_info: ProgressInfo,
    ) -> Result<(), RenderStorageError> {
        let renders = self.renders.read().await;
        let render = match renders.get(&render_id) {
            Some(r) => r,
            None => return Err(format!("render {render_id} not found")),
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
                Ok(())
            }
            _ => Ok(()), // don't update progress for non-running states
        }
    }

    async fn create_render_checkpoint(
        &self,
        render_checkpoint: RenderCheckpoint,
    ) -> Result<(), RenderStorageError> {
        println!(
            "Creating render checkpoint {} for id: {}",
            render_checkpoint.iteration, render_checkpoint.render_id
        );
        {
            self.checkpoints.write().await.push(render_checkpoint);
        }

        Ok(())
    }

    async fn get_render_checkpoint(
        &self,
        render_id: RenderID,
        iteration: u32,
    ) -> Result<Option<RenderCheckpoint>, RenderStorageError> {
        Ok(self
            .checkpoints
            .read()
            .await
            .iter()
            .find(|c| c.render_id == render_id && c.iteration == iteration)
            .cloned())
    }

    async fn delete_render_and_checkpoints(&self, id: RenderID) -> Result<(), RenderStorageError> {
        // Remove render
        self.renders.write().await.remove(&id);

        // Remove associated checkpoints
        let mut checkpoints = self.checkpoints.write().await;
        checkpoints.retain(|c| c.render_id != id);

        Ok(())
    }

    async fn get_next_id(&self) -> Result<RenderID, RenderStorageError> {
        Ok(match self.renders.read().await.keys().max() {
            Some(id) => id + 1,
            None => 1,
        })
    }

    fn get_update_progress_fn<'a>(&'a self, render_id: RenderID) -> AsyncProgressFn<'a> {
        Box::new(move |progress_info: ProgressInfo| {
            Box::pin(async move {
                if let Err(e) = self.update_render_progress(render_id, progress_info).await {
                    println!("Failed to update render state: {e}");
                }
            })
        })
    }

    async fn find_running_renders(&self) -> Result<Vec<Render>, RenderStorageError> {
        Ok(self
            .get_all_renders()
            .await?
            .into_iter()
            .filter(|r| matches!(r.state, RenderState::Running { .. }))
            .collect())
    }

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
