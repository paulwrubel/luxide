use std::{collections::HashMap, sync::Arc};

use futures::StreamExt;
use tokio::sync::RwLock;

use super::{Render, RenderCheckpoint, RenderID, RenderState, RenderStorage, RenderStorageError};

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

    async fn get_next_id(&self) -> Result<RenderID, RenderStorageError> {
        Ok(match self.renders.read().await.keys().max() {
            Some(id) => id + 1,
            None => 1,
        })
    }
}
