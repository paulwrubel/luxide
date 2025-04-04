use std::{fs, path::PathBuf, sync::Arc};

use time::OffsetDateTime;
use tokio::sync::RwLock;

use crate::{
    tracing::{Render, RenderCheckpoint, RenderID, RenderState},
    utils,
};

use super::{ProgressInfo, RenderStorage, RenderStorageError};

#[derive(Clone)]
pub struct FileStorage {
    output_dir: PathBuf,
    renders: Arc<RwLock<Vec<(Render, PathBuf)>>>,
}

impl FileStorage {
    pub fn new(output_dir: PathBuf) -> Result<Self, RenderStorageError> {
        fs::create_dir_all(&output_dir).map_err(|e| e.to_string())?;
        Ok(Self {
            output_dir,
            renders: Arc::new(RwLock::new(Vec::new())),
        })
    }

    async fn get_render_dir(&self, render: &Render) -> Result<PathBuf, RenderStorageError> {
        let now = OffsetDateTime::now_utc();
        let formatted_timestamp = utils::get_formatted_timestamp_for(now);
        let sub_folder = format!(
            "{}_{}_{}",
            render.id, render.config.name, formatted_timestamp
        );
        Ok(self.output_dir.join(sub_folder))
    }
}

#[async_trait::async_trait]
impl RenderStorage for FileStorage {
    async fn get_render(&self, id: RenderID) -> Result<Option<Render>, RenderStorageError> {
        Ok(self
            .renders
            .read()
            .await
            .iter()
            .find(|(r, _)| r.id == id)
            .cloned()
            .map(|(r, _)| r))
    }

    async fn render_exists(&self, id: RenderID) -> Result<bool, RenderStorageError> {
        Ok(self.renders.read().await.iter().any(|(r, _)| r.id == id))
    }

    async fn get_all_renders(&self) -> Result<Vec<Render>, RenderStorageError> {
        Ok(self
            .renders
            .read()
            .await
            .iter()
            .map(|(r, _)| r.clone())
            .collect())
    }

    async fn create_render(&self, render: Render) -> Result<Render, RenderStorageError> {
        let render_dir = self.get_render_dir(&render).await?;
        fs::create_dir_all(&render_dir).map_err(|e| e.to_string())?;

        self.renders
            .write()
            .await
            .push((render.clone(), render_dir));

        Ok(render)
    }

    async fn update_render_state(
        &self,
        id: RenderID,
        state: RenderState,
    ) -> Result<(), RenderStorageError> {
        match self
            .renders
            .write()
            .await
            .iter_mut()
            .find_map(|(r, _)| if r.id == id { Some(r) } else { None })
        {
            Some(render) => {
                render.state = state;
                Ok(())
            }
            None => Err(format!("Render with id {id} not found").into()),
        }
    }

    async fn update_render_progress(
        &self,
        id: RenderID,
        progress_info: ProgressInfo,
    ) -> Result<(), RenderStorageError> {
        match self
            .renders
            .write()
            .await
            .iter_mut()
            .find_map(|(r, _)| if r.id == id { Some(r) } else { None })
        {
            Some(render) => {
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
            None => Err(format!("Render with id {id} not found").into()),
        }
    }

    async fn update_render_checkpoints(
        &self,
        id: RenderID,
        new_total_checkpoints: u32,
    ) -> Result<(), RenderStorageError> {
        match self
            .renders
            .write()
            .await
            .iter_mut()
            .find_map(|(r, _)| if r.id == id { Some(r) } else { None })
        {
            Some(render) => {
                render.config.parameters.checkpoints = new_total_checkpoints;
                Ok(())
            }
            None => Err(format!("Render with id {id} not found").into()),
        }
    }

    async fn get_render_checkpoint(
        &self,
        id: RenderID,
        iteration: u32,
    ) -> Result<Option<RenderCheckpoint>, RenderStorageError> {
        let renders = self.renders.read().await;
        let (render, dir) = match renders.iter().find(|(r, _)| r.id == id) {
            Some((r, dir)) => (r, dir),
            None => return Err(format!("Render {} not found", id).into()),
        };

        let checkpoint_dir = dir.join("checkpoints");
        let checkpoint_image_file = checkpoint_dir.join(format!("{}.png", iteration));
        if !checkpoint_image_file.exists() {
            return Ok(None);
        }

        // load checkpoint image if it exists
        let image = image::open(checkpoint_image_file)
            .map_err(|e| e.to_string())?
            .to_rgba8();

        Ok(Some(RenderCheckpoint::from_image(
            id,
            iteration,
            image,
            &render.config.parameters,
        )))
    }

    async fn render_checkpoint_exists(
        &self,
        id: RenderID,
        iteration: u32,
    ) -> Result<bool, RenderStorageError> {
        let renders = self.renders.read().await;
        let dir = match renders.iter().find(|(r, _)| r.id == id) {
            Some((_, dir)) => dir,
            None => return Err(format!("Render {} not found", id).into()),
        };

        let checkpoint_dir = dir.join("checkpoints");
        let checkpoint_image_file = checkpoint_dir.join(format!("{}.png", iteration));
        Ok(checkpoint_image_file.exists())
    }

    async fn create_render_checkpoint(
        &self,
        checkpoint: RenderCheckpoint,
    ) -> Result<(), RenderStorageError> {
        let renders = self.renders.read().await;
        let (render, dir) = match renders.iter().find(|(r, _)| r.id == checkpoint.render_id) {
            Some((r, dir)) => (r, dir),
            None => return Err(format!("Render {} not found", checkpoint.render_id).into()),
        };

        let checkpoint_dir = dir.join("checkpoints");
        if !checkpoint_dir.exists() {
            fs::create_dir_all(&checkpoint_dir).map_err(|e| e.to_string())?;
        }

        // save checkpoint data as a png image
        let image_file = checkpoint_dir.join(format!("{}.png", checkpoint.iteration));
        let image = checkpoint.as_image(&render.config.parameters);
        image.save(image_file).map_err(|e| e.to_string())?;

        Ok(())
    }

    async fn delete_render_and_checkpoints(&self, id: RenderID) -> Result<(), RenderStorageError> {
        // get render directory
        let dir = {
            let renders = self.renders.read().await;
            match renders
                .iter()
                .find_map(|(r, dir)| if r.id == id { Some(dir) } else { None })
            {
                Some(dir) => dir.clone(),
                None => return Err(format!("Render {} not found", id).into()),
            }
        };

        // remove render from memory
        self.renders.write().await.retain(|(r, _)| r.id != id);

        // remove render directory
        if dir.exists() {
            fs::remove_dir_all(dir).map_err(|e| e.to_string())?;
        }

        Ok(())
    }

    async fn get_next_id(&self) -> Result<RenderID, RenderStorageError> {
        let renders = self.renders.read().await;
        let max_id = renders.iter().map(|(r, _)| r.id).max().unwrap_or(0);

        Ok(max_id + 1)
    }

    async fn update_progress<'a>(&'a self, render_id: RenderID, progress_info: ProgressInfo) {
        if let Err(e) = self.update_render_progress(render_id, progress_info).await {
            println!("Failed to update render state: {}", e);
        }

        // TODO: print info out here! this is the spot!

        // print!(
        //     "\r{}{}{}",
        //     " ".repeat(indentation),
        //     progress_string,
        //     " ".repeat(10)
        // );
        // stdout().flush().unwrap();
    }
}
