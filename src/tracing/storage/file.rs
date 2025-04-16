use std::{fs, os::unix::fs::MetadataExt, path::PathBuf, sync::Arc};

use serde::{Deserialize, Serialize};
use tokio::sync::RwLock;

use crate::{
    tracing::{Render, RenderCheckpoint, RenderID, RenderState},
    utils,
};

use super::{ProgressInfo, RenderCheckpointMeta, RenderStorage, StorageError, UserID};

#[derive(Clone)]
pub struct FileStorage {
    output_dir: PathBuf,
    renders: Arc<RwLock<Vec<(Render, PathBuf)>>>,
}

#[derive(Clone, Copy, Serialize, Deserialize)]
pub struct RenderCheckpointFileMeta {
    started_at: chrono::DateTime<chrono::Utc>,
    ended_at: chrono::DateTime<chrono::Utc>,
}

impl From<RenderCheckpoint> for RenderCheckpointFileMeta {
    fn from(checkpoint: RenderCheckpoint) -> Self {
        Self {
            started_at: checkpoint.started_at,
            ended_at: checkpoint.ended_at,
        }
    }
}

impl FileStorage {
    pub fn new(output_dir: PathBuf) -> Result<Self, StorageError> {
        fs::create_dir_all(&output_dir).map_err(|e| e.to_string())?;
        Ok(Self {
            output_dir,
            renders: Arc::new(RwLock::new(Vec::new())),
        })
    }

    async fn get_render_dir(&self, render: &Render) -> Result<PathBuf, StorageError> {
        let now = chrono::Utc::now();
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
    async fn get_render(&self, id: RenderID) -> Result<Option<Render>, StorageError> {
        Ok(self
            .renders
            .read()
            .await
            .iter()
            .find(|(r, _)| r.id == id)
            .cloned()
            .map(|(r, _)| r))
    }

    async fn render_exists(&self, id: RenderID) -> Result<bool, StorageError> {
        Ok(self.renders.read().await.iter().any(|(r, _)| r.id == id))
    }

    async fn render_belongs_to(&self, id: RenderID, user_id: UserID) -> Result<bool, StorageError> {
        Ok(self
            .renders
            .read()
            .await
            .iter()
            .find(|(r, _)| r.id == id)
            .is_some_and(|(r, _)| r.user_id == user_id))
    }

    async fn get_all_renders(&self) -> Result<Vec<Render>, StorageError> {
        Ok(self
            .renders
            .read()
            .await
            .iter()
            .map(|(r, _)| r.clone())
            .collect())
    }

    async fn get_all_renders_for_user_id(
        &self,
        user_id: UserID,
    ) -> Result<Vec<Render>, StorageError> {
        Ok(self
            .renders
            .read()
            .await
            .iter()
            .filter(|(r, _)| r.user_id == user_id)
            .map(|(r, _)| r.clone())
            .collect())
    }

    async fn create_render(&self, render: Render) -> Result<Render, StorageError> {
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
    ) -> Result<(), StorageError> {
        match self
            .renders
            .write()
            .await
            .iter_mut()
            .find_map(|(r, _)| if r.id == id { Some(r) } else { None })
        {
            Some(render) => {
                render.state = state;
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
            None => Err(format!("Render with id {id} not found").into()),
        }
    }

    async fn update_render_total_checkpoints(
        &self,
        id: RenderID,
        new_total_checkpoints: u32,
    ) -> Result<(), StorageError> {
        match self
            .renders
            .write()
            .await
            .iter_mut()
            .find_map(|(r, _)| if r.id == id { Some(r) } else { None })
        {
            Some(render) => {
                render.config.parameters.total_checkpoints = new_total_checkpoints;
                render.mark_updated();
                Ok(())
            }
            None => Err(format!("Render with id {id} not found").into()),
        }
    }

    async fn get_render_checkpoint(
        &self,
        id: RenderID,
        iteration: u32,
    ) -> Result<Option<RenderCheckpoint>, StorageError> {
        let renders = self.renders.read().await;
        let (render, dir) = match renders.iter().find(|(r, _)| r.id == id) {
            Some((r, dir)) => (r, dir),
            None => return Err(format!("Render {} not found", id).into()),
        };

        let checkpoint_dir = dir.join("checkpoints");
        let checkpoint_image_file = checkpoint_dir.join(format!("{}.png", iteration));
        let checkpoint_meta_file = checkpoint_dir.join(format!("{}.json", iteration));
        match (
            checkpoint_meta_file.exists(),
            checkpoint_image_file.exists(),
        ) {
            (false, true) => {
                return Err(format!(
                    "Checkpoint iteration {} image exists but metadata file is missing for render {}",
                    iteration, id
                ).into());
            }
            (true, false) => {
                return Err(format!(
                    "Checkpoint iteration {} metadata exists but image is missing for render {}",
                    iteration, id
                )
                .into());
            }
            (false, false) => return Ok(None),
            _ => {}
        };

        // load checkpoint image
        let image = image::open(checkpoint_image_file)
            .map_err(|e| e.to_string())?
            .to_rgba8();

        // load checkpoint metadata
        let meta = fs::read_to_string(checkpoint_meta_file).map_err(|e| e.to_string())?;
        let meta: RenderCheckpointFileMeta =
            serde_json::from_str(&meta).map_err(|e| e.to_string())?;

        Ok(Some(RenderCheckpoint::from_image(
            id,
            iteration,
            image,
            &render.config.parameters,
            meta.started_at,
            meta.ended_at,
        )))
    }

    async fn get_most_recent_render_checkpoint_iteration(
        &self,
        id: RenderID,
    ) -> Result<Option<u32>, StorageError> {
        let renders = self.renders.read().await;
        let dir = match renders.iter().find(|(r, _)| r.id == id) {
            Some((_, dir)) => dir,
            None => return Err(format!("Render {} not found", id).into()),
        };

        let checkpoint_dir = dir.join("checkpoints");
        let checkpoint_files = fs::read_dir(checkpoint_dir).map_err(|e| e.to_string())?;

        let mut latest_iteration = None;
        for entry in checkpoint_files {
            let path = entry.map_err(|e| e.to_string())?.path();
            if path.is_file() && path.extension().map(|ext| ext == "png").unwrap_or(false) {
                let iteration = path
                    .file_name()
                    .and_then(|name| name.to_str().and_then(|s| s.parse::<u32>().ok()));
                if let Some(iteration) = iteration {
                    latest_iteration = Some(latest_iteration.unwrap_or(0).max(iteration));
                }
            }
        }

        Ok(latest_iteration)
    }

    async fn get_render_checkpoints_without_data(
        &self,
        id: RenderID,
    ) -> Result<Vec<RenderCheckpointMeta>, StorageError> {
        let renders = self.renders.read().await;
        let dir = match renders.iter().find(|(r, _)| r.id == id) {
            Some((_, dir)) => dir,
            None => return Err(format!("Render {} not found", id).into()),
        };

        let checkpoint_dir = dir.join("checkpoints");
        let checkpoint_files = fs::read_dir(checkpoint_dir).map_err(|e| e.to_string())?;

        let checkpoint_metas = checkpoint_files.filter_map(|f| {
            let entry = match f {
                Ok(entry) => entry,
                Err(e) => return Some(Err(format!("Failed to read checkpoint file: {}", e))),
            };

            // check file extension
            let path = entry.path();
            match path.extension() {
                None => return None,
                Some(ext) => {
                    if ext != "json" {
                        return None;
                    }
                }
            };

            // get file name
            let iteration = match path.file_stem() {
                Some(file_stem) => match file_stem.to_str().map(|s| s.parse::<u32>()) {
                    Some(parse_res) => parse_res.map_err(|e| {
                        format!(
                            "Failed to parse filename ({}) as u32: {}",
                            path.file_name()
                                .map(|oss| oss.to_str().unwrap_or("???"))
                                .unwrap_or("???"),
                            e.to_string()
                        )
                    }),
                    None => Err(format!(
                        "Failed to parse filename ({}) as valid unicode",
                        path.file_name()
                            .map(|oss| oss.to_str().unwrap_or("???"))
                            .unwrap_or("???")
                    )),
                },
                None => Err(format!("Failed to parse filename: no stem!")),
            };
            let iteration = match iteration {
                Ok(i) => i,
                Err(e) => return Some(Err(e)),
            };

            // read meta file
            let meta_file_string = match fs::read_to_string(path) {
                Ok(s) => s,
                Err(e) => return Some(Err(e.to_string())),
            };

            // parse meta file
            let meta_file: RenderCheckpointFileMeta = match serde_json::from_str(&meta_file_string)
            {
                Ok(m) => m,
                Err(e) => return Some(Err(e.to_string())),
            };

            Some(Ok(RenderCheckpointMeta {
                render_id: id,
                iteration,
                started_at: meta_file.started_at,
                ended_at: meta_file.ended_at,
            }))
        });

        checkpoint_metas
            .collect::<Result<Vec<_>, String>>()
            .map_err(|e| StorageError::from(e))
    }

    async fn render_checkpoint_exists(
        &self,
        id: RenderID,
        iteration: u32,
    ) -> Result<bool, StorageError> {
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
    ) -> Result<(), StorageError> {
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
        image
            .save_with_format(image_file, image::ImageFormat::Png)
            .map_err(|e| e.to_string())?;

        let meta_file = checkpoint_dir.join(format!("{}.json", checkpoint.iteration));
        fs::write(
            meta_file,
            serde_json::to_string(&RenderCheckpointFileMeta::from(checkpoint))
                .map_err(|e| e.to_string())?,
        )
        .map_err(|e| e.to_string())?;

        Ok(())
    }

    async fn delete_render_and_checkpoints(&self, id: RenderID) -> Result<(), StorageError> {
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

    async fn get_next_id(&self) -> Result<RenderID, StorageError> {
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

    async fn get_render_checkpoint_storage_usage_bytes(&self) -> Result<u64, StorageError> {
        let renders = self.renders.read().await;

        let render_sizes = renders.iter().map(|(r, dir)| {
            let checkpoint_dir = dir.join("checkpoints");
            if checkpoint_dir.exists() {
                let entries = fs::read_dir(checkpoint_dir).map_err(|e| {
                    format!(
                        "Cannot read checkpoint directory for render {}: {}",
                        r.id, e
                    )
                })?;

                let checkpoint_sizes = entries
                    .map(|e| -> Result<u64, String> {
                        let entry = e.map_err(|e| {
                            format!("Cannot get directory entry for render {}: {}", r.id, e)
                        })?;

                        let file_size_bytes = entry
                            .metadata()
                            .map_err(|e| format!("Cannot get metadata for render {}: {}", r.id, e))?
                            .size();

                        Ok(file_size_bytes)
                    })
                    .sum::<Result<u64, String>>()?;

                Ok::<u64, String>(checkpoint_sizes)
            } else {
                Err(format!("Checkpoint directory does not exist for render {}", r.id).into())
            }
        });

        Ok(render_sizes.sum::<Result<u64, String>>()?)
    }
}
