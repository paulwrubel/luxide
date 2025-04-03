use std::{
    fmt::Display,
    sync::{Arc, Mutex},
};

use axum::http::StatusCode;
use image::RgbaImage;
use tokio::sync::mpsc;

use crate::{
    deserialization::RenderConfig,
    tracing::{PixelData, RenderState, Threads, Tracer},
    utils::{ProgressInfo, ProgressTracker},
};

use super::{Render, RenderCheckpoint, RenderID, RenderStorage, RenderStorageError};

use std::collections::HashSet;

#[derive(Clone)]
pub struct RenderManager {
    storage: Arc<dyn RenderStorage>,
    global_thread_pool: Option<Arc<rayon::ThreadPool>>,
    running_renders: Arc<Mutex<HashSet<RenderID>>>,
}

const POLLING_INTERVAL_MS: u64 = 1000;

impl RenderManager {
    pub async fn new(storage: Arc<dyn RenderStorage>) -> Result<Self, String> {
        Self::new_with_optional_global_thread_pool(storage, None).await
    }

    pub async fn new_with_global_thread_pool(
        storage: Arc<dyn RenderStorage>,
        threads: Threads,
    ) -> Result<Self, String> {
        Self::new_with_optional_global_thread_pool(
            storage,
            Some(Arc::new(
                rayon::ThreadPoolBuilder::new()
                    .num_threads(threads.effective_count())
                    .build()
                    .unwrap(),
            )),
        )
        .await
    }

    async fn new_with_optional_global_thread_pool(
        storage: Arc<dyn RenderStorage>,
        thread_pool: Option<Arc<rayon::ThreadPool>>,
    ) -> Result<Self, String> {
        // find any renders that were left in Running or Pausing state
        let mut running_or_pausing_renders = storage
            .find_renders_in_state(RenderState::Running {
                checkpoint_iteration: 0,
                progress_info: ProgressInfo::empty(),
            })
            .await?;
        running_or_pausing_renders.extend(
            storage
                .find_renders_in_state(RenderState::Pausing {
                    checkpoint_iteration: 0,
                    progress_info: ProgressInfo::empty(),
                })
                .await?,
        );

        // revert them to their last checkpoint
        for render in running_or_pausing_renders {
            println!(
                "Reverting interrupted render {} to last checkpoint",
                render.id
            );
            storage.revert_to_last_checkpoint(render.id).await?;
        }

        Ok(Self {
            storage,
            global_thread_pool: thread_pool,
            running_renders: Arc::new(Mutex::new(HashSet::new())),
        })
    }

    pub async fn start(&self) {
        println!("Starting render manager...");

        loop {
            {
                let renders = {
                    match self.storage.get_all_renders().await {
                        Ok(renders) => renders,
                        Err(e) => {
                            println!("Failed to get renders: {e}");
                            continue;
                        }
                    }
                };

                // move Created renders to Running
                let created_renders = renders.iter().filter(|r| {
                    r.state == RenderState::Created && r.config.parameters.checkpoints > 0
                });
                for render in created_renders.cloned() {
                    self.spawn_tracer_thread_to_next_checkpoint(render, None)
                        .await;
                }

                // move FinishedCheckpoint renders to next checkpoint if applicable
                let checkpointed_renders = renders.iter().filter(|r| match r.state {
                    RenderState::FinishedCheckpointIteration(checkpoint) => {
                        checkpoint < r.config.parameters.checkpoints
                    }
                    _ => false,
                });
                for render in checkpointed_renders.cloned() {
                    let previous_checkpoint = match render.state {
                        RenderState::FinishedCheckpointIteration(checkpoint) => {
                            match self
                                .storage
                                .get_render_checkpoint(render.id, checkpoint)
                                .await
                            {
                                Ok(Some(checkpoint)) => Some(checkpoint),
                                Ok(None) => None,
                                Err(e) => {
                                    println!("Failed to get render checkpoint: {e}");
                                    continue;
                                }
                            }
                        }
                        _ => None,
                    };

                    self.spawn_tracer_thread_to_next_checkpoint(render, previous_checkpoint)
                        .await;
                }
            }

            // sleep until time to poll again
            tokio::time::sleep(tokio::time::Duration::from_millis(POLLING_INTERVAL_MS)).await;
        }
    }

    async fn spawn_tracer_thread_to_next_checkpoint(
        &self,
        render: Render,
        previous_checkpoint: Option<RenderCheckpoint>,
    ) -> tokio::task::JoinHandle<()> {
        // add render to running set
        self.running_renders.lock().unwrap().insert(render.id);

        let running_renders = Arc::clone(&self.running_renders);
        let storage = Arc::clone(&self.storage);
        let thread_pool = self.global_thread_pool.as_ref().cloned();

        let join_handle = tokio::spawn(async move {
            let tracer = match thread_pool {
                Some(pool) => Tracer::from_thread_pool(pool),
                None => Tracer::new(),
            };

            let iteration = match previous_checkpoint {
                Some(ref rcp) => rcp.iteration + 1,
                None => 1,
            };

            match storage
                .update_render_state(
                    render.id,
                    RenderState::Running {
                        checkpoint_iteration: iteration,
                        progress_info: ProgressInfo::default(),
                    },
                )
                .await
            {
                Err(e) => {
                    println!("Failed to update render state: {e}");
                    // remove from running set on error
                    running_renders.lock().unwrap().remove(&render.id);
                    return;
                }
                Ok(_) => (),
            }

            let initial_pixel_data = match previous_checkpoint {
                Some(rcp) => rcp.pixel_data,
                None => PixelData::new(),
            };

            let render_data = render
                .config
                .compile()
                .expect("Failing to compile render config at tracing time!");

            let (sender, mut receiver) = mpsc::channel(100);

            let (width, height) = render.config.parameters.image_dimensions;
            let new_pixel_data = {
                let storage = Arc::clone(&storage);

                let (_, new_pixel_data) = tokio::join!(
                    async move {
                        let total = u64::from(width) * u64::from(height);
                        let mut progress_tracker = ProgressTracker::new(
                            total,
                            50,
                            (total / 1000).max(1),
                            |progress_info| storage.update_progress(render.id, progress_info),
                        );
                        while let Some(_) = receiver.recv().await {
                            progress_tracker.mark().await;
                        }
                    },
                    async move {
                        let new_pixel_data = tokio::task::spawn_blocking(move || {
                            let data = tracer.render_to_checkpoint_iteration(
                                iteration,
                                initial_pixel_data,
                                &render_data,
                                sender,
                            );
                            data
                        })
                        .await;

                        new_pixel_data.expect("Failed to render to checkpoint")
                    },
                );

                new_pixel_data
            };

            println!("Saving pixel_data...");
            match storage
                .create_render_checkpoint(RenderCheckpoint {
                    render_id: render.id,
                    iteration,
                    pixel_data: new_pixel_data,
                })
                .await
            {
                Err(e) => {
                    println!("Failed to create render checkpoint: {e}");
                    // remove from running set on error
                    running_renders.lock().unwrap().remove(&render.id);
                    return;
                }
                Ok(_) => (),
            }
            println!("Finished saving pixel_data");

            // check if render was paused
            let current_state = match storage.get_render(render.id).await {
                Ok(Some(r)) => r.state,
                Ok(None) => {
                    println!("Render {} not found", render.id);
                    running_renders.lock().unwrap().remove(&render.id);
                    return;
                }
                Err(e) => {
                    println!("Failed to get render state: {e}");
                    running_renders.lock().unwrap().remove(&render.id);
                    return;
                }
            };

            // check current state to handle completion
            match current_state {
                RenderState::Running { .. } => {
                    match storage
                        .update_render_state(
                            render.id,
                            RenderState::FinishedCheckpointIteration(iteration),
                        )
                        .await
                    {
                        Ok(_) => {
                            // remove render from running set
                            println!(
                                "Render {} completed checkpoint iteration {}",
                                render.id, iteration
                            );
                            running_renders.lock().unwrap().remove(&render.id);
                        }
                        Err(e) => {
                            println!("Failed to update render state: {e}");
                        }
                    }
                }
                RenderState::Pausing { .. } => {
                    // render was paused during this checkpoint, transition to fully paused
                    match storage
                        .update_render_state(render.id, RenderState::Paused(iteration))
                        .await
                    {
                        Ok(_) => {
                            println!("Render {} paused at checkpoint {}", render.id, iteration);
                        }
                        Err(e) => {
                            println!("Failed to update paused render state: {e}");
                        }
                    }
                    running_renders.lock().unwrap().remove(&render.id);
                }
                _ => {
                    println!(
                        "Render {} in unexpected state {:?}",
                        render.id, current_state
                    );
                    running_renders.lock().unwrap().remove(&render.id);
                }
            }
        });

        join_handle
    }

    pub async fn get_render(&self, id: RenderID) -> Result<Option<Render>, RenderManagerError> {
        if !self.storage.render_exists(id).await? {
            return Ok(None);
        }

        self.storage.get_render(id).await.map_err(|e| e.into())
    }

    pub async fn get_all_renders(&self) -> Result<Vec<Render>, RenderManagerError> {
        self.storage.get_all_renders().await.map_err(|e| e.into())
    }

    pub async fn create_render(
        &self,
        render_config: RenderConfig,
    ) -> Result<Render, RenderManagerError> {
        // compile just for validation purposes
        if let Err(e) = render_config.compile() {
            return Err(RenderManagerError::ClientError(StatusCode::BAD_REQUEST, e));
        }

        let next_id = self.storage.get_next_id().await?;
        let render = Render::new(next_id, render_config);
        self.storage
            .create_render(render)
            .await
            .map_err(|e| e.into())
    }

    pub async fn get_render_checkpoint(
        &self,
        id: RenderID,
        iteration: u32,
    ) -> Result<Option<RenderCheckpoint>, RenderManagerError> {
        if !self.storage.render_exists(id).await? {
            return Ok(None);
        }

        if !self.storage.render_checkpoint_exists(id, iteration).await? {
            return Ok(None);
        }

        self.storage
            .get_render_checkpoint(id, iteration)
            .await
            .map_err(|e| e.into())
    }

    pub async fn delete_render_and_checkpoints(
        &self,
        id: RenderID,
    ) -> Result<(), RenderManagerError> {
        // check if render is running
        let is_running = self.running_renders.lock().unwrap().contains(&id);
        if is_running {
            return Err(RenderManagerError::ClientError(
                StatusCode::BAD_REQUEST,
                "Cannot delete a render while it is running".to_string(),
            ));
        }

        // delete the render and its checkpoints
        self.storage
            .delete_render_and_checkpoints(id)
            .await
            .map_err(|e| e.into())
    }

    pub async fn pause_render(&self, id: RenderID) -> Result<(), RenderManagerError> {
        // get render
        let render = match self.get_render(id).await? {
            Some(r) => r,
            None => {
                return Err(RenderManagerError::ClientError(
                    StatusCode::NOT_FOUND,
                    "Render not found".to_string(),
                ));
            }
        };

        // can only pause a running render
        match render.state {
            RenderState::Running {
                checkpoint_iteration,
                progress_info,
            } => {
                // when pausing, we first mark it as Pausing at the current checkpoint
                // the render thread will see this and transition to Paused when done
                println!("Pausing render {id} at checkpoint {checkpoint_iteration}");
                self.storage
                    .update_render_state(
                        id,
                        RenderState::Pausing {
                            checkpoint_iteration,
                            progress_info,
                        },
                    )
                    .await
                    .map_err(|e| e.into())
            }
            _ => Err(RenderManagerError::ClientError(
                StatusCode::BAD_REQUEST,
                format!("Cannot pause render {id} in state {:?}", render.state),
            )),
        }
    }

    pub async fn resume_render(&self, id: RenderID) -> Result<(), RenderManagerError> {
        // get render
        let render = match self.get_render(id).await? {
            Some(r) => r,
            None => {
                return Err(RenderManagerError::ClientError(
                    StatusCode::NOT_FOUND,
                    "Render not found".to_string(),
                ));
            }
        };

        // can only resume a pausing or paused render
        match render.state {
            RenderState::Paused(checkpoint_iteration) => {
                // if the render is paused, just transition it to FinishedCheckpointIteration
                //
                // if it has more checkpoints to complete, the main loop will pick it up
                println!("Resuming render {id} at checkpoint {checkpoint_iteration}");
                self.storage
                    .update_render_state(
                        id,
                        RenderState::FinishedCheckpointIteration(checkpoint_iteration),
                    )
                    .await
                    .map_err(|e| e.into())
            }
            RenderState::Pausing {
                checkpoint_iteration,
                progress_info,
            } => {
                // if the render is pausing, that means the render thread for it is still running,
                // so we can just seamlessly roll it back to Running and nothing will have changed
                println!("Resuming render {id}");
                self.storage
                    .update_render_state(
                        id,
                        RenderState::Running {
                            checkpoint_iteration,
                            progress_info,
                        },
                    )
                    .await
                    .map_err(|e| e.into())
            }
            _ => {
                return Err(RenderManagerError::ClientError(
                    StatusCode::BAD_REQUEST,
                    format!("Cannot resume render {id} in state {:?}", render.state),
                ));
            }
        }
    }

    pub async fn extend_render(
        &self,
        id: RenderID,
        new_total_checkpoints: u32,
    ) -> Result<(), RenderManagerError> {
        // get render
        let render = match self.get_render(id).await? {
            Some(r) => r,
            None => {
                return Err(RenderManagerError::ClientError(
                    StatusCode::NOT_FOUND,
                    "Render not found".to_string(),
                ));
            }
        };

        // make sure the extension is actually greater than the current total checkpoints
        if new_total_checkpoints <= render.config.parameters.checkpoints {
            return Err(RenderManagerError::ClientError(
                StatusCode::BAD_REQUEST,
                format!(
                    "New total checkpoints ({}) must be greater than current total checkpoints ({})",
                    new_total_checkpoints, render.config.parameters.checkpoints
                ),
            ));
        }

        // update render
        self.storage
            .update_render_checkpoints(id, new_total_checkpoints)
            .await
            .map_err(|e| e.into())
    }

    pub async fn get_render_checkpoint_as_image(
        &self,
        id: RenderID,
        iteration: u32,
    ) -> Result<Option<RgbaImage>, RenderManagerError> {
        let render = self.storage.get_render(id).await?;
        let params = match render {
            Some(r) => r.config.parameters,
            None => return Ok(None),
        };

        let checkpoint = self.storage.get_render_checkpoint(id, iteration).await?;
        Ok(checkpoint.map(|rcp| rcp.as_image(&params)))
    }
}
pub enum RenderManagerError {
    ClientError(StatusCode, String),
    ServerError(String),
}

impl From<RenderStorageError> for RenderManagerError {
    fn from(error: RenderStorageError) -> Self {
        RenderManagerError::ServerError(error.0)
    }
}

impl Display for RenderManagerError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            RenderManagerError::ClientError(status, message) => {
                write!(f, "Client Error: {} | {}", status, message)
            }
            RenderManagerError::ServerError(message) => {
                write!(f, "Server Error: 500 | {}", message)
            }
        }
    }
}
