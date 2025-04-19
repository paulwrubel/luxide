use std::{
    fmt::Display,
    sync::{Arc, Mutex},
    time::Duration,
};

use axum::http::StatusCode;
use image::RgbaImage;
use serde::Serialize;
use tokio::sync::mpsc;

use crate::{
    deserialization::{RenderConfig, RenderConfigBuilder},
    tracing::{PixelData, RenderState, Threads, Tracer},
    utils::{ProgressInfo, ProgressTracker},
};

use super::{Render, RenderCheckpoint, RenderID, RenderStorage, Role, StorageError, User, UserID};

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
                    r.state == RenderState::Created && r.config.parameters.total_checkpoints > 0
                });
                for render in created_renders.cloned() {
                    self.spawn_tracer_thread_to_next_checkpoint(render, None)
                        .await;
                }

                // move FinishedCheckpoint renders to next checkpoint if applicable
                let checkpointed_renders = renders.iter().filter(|r| match r.state {
                    RenderState::FinishedCheckpointIteration(checkpoint) => {
                        checkpoint < r.config.parameters.total_checkpoints
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
            let started_at = chrono::Utc::now();
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

            let ended_at = chrono::Utc::now();

            println!("Saving pixel_data...");
            match storage
                .create_render_checkpoint(RenderCheckpoint {
                    render_id: render.id,
                    iteration,
                    pixel_data: new_pixel_data,
                    started_at,
                    ended_at,
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

            println!("Checking if old checkpoints need to be deleted...");
            let total_checkpoints_saved = match storage.get_render_checkpoint_count(render.id).await
            {
                Ok(count) => count,
                Err(e) => {
                    println!("  Failed to get checkpoint count: {e}");
                    running_renders.lock().unwrap().remove(&render.id);
                    return;
                }
            };

            if render
                .config
                .parameters
                .saved_checkpoint_limit
                .is_some_and(|limit| limit < total_checkpoints_saved)
            {
                println!("  Deleting old checkpoints...");
                println!("    Finding earliest checkpoint...");
                let earliest_checkpoint = match storage
                    .get_earliest_render_checkpoint_iteration(render.id)
                    .await
                {
                    Ok(Some(iteration)) => iteration,
                    Ok(None) => {
                        println!("    No checkpoints found for render {}", render.id);
                        running_renders.lock().unwrap().remove(&render.id);
                        return;
                    }
                    Err(e) => {
                        println!(
                            "    Failed to get earliest render checkpoint for id {}: {}",
                            render.id, e
                        );
                        running_renders.lock().unwrap().remove(&render.id);
                        return;
                    }
                };
                println!("    Found earliest checkpoint: {}", earliest_checkpoint);
                println!("    Deleting checkpoint {}...", earliest_checkpoint);
                match storage
                    .delete_render_checkpoint(render.id, earliest_checkpoint)
                    .await
                {
                    Err(e) => {
                        println!("Failed to delete old render checkpoint: {e}");
                        // remove from running set on error
                        running_renders.lock().unwrap().remove(&render.id);
                        return;
                    }
                    Ok(_) => (),
                }
                println!("  Finished deleting old checkpoints");
            }
            println!("Finished checking if old checkpoints need to be deleted");

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

    pub async fn get_render(
        &self,
        id: RenderID,
        user_id: UserID,
    ) -> Result<Option<Render>, RenderManagerError> {
        if !self.storage.render_exists(id).await? {
            return Ok(None);
        }

        if !self.storage.render_belongs_to(id, user_id).await? {
            return Err(RenderManagerError::ClientError(
                StatusCode::FORBIDDEN,
                "Forbidden".to_string(),
            ));
        }

        self.storage.get_render(id).await.map_err(|e| e.into())
    }

    pub async fn get_all_renders(
        &self,
        user_id: UserID,
    ) -> Result<Vec<Render>, RenderManagerError> {
        self.storage
            .get_all_renders_for_user_id(user_id)
            .await
            .map_err(|e| e.into())
    }

    pub async fn get_render_stats(
        &self,
        id: RenderID,
        user_id: UserID,
    ) -> Result<Option<RenderStats>, RenderManagerError> {
        if !self.storage.render_exists(id).await? {
            return Ok(None);
        }

        if !self.storage.render_belongs_to(id, user_id).await? {
            return Err(RenderManagerError::ClientError(
                StatusCode::FORBIDDEN,
                "Forbidden".to_string(),
            ));
        }

        let render = self.storage.get_render(id).await?.unwrap();
        let checkpoints_meta = self.storage.get_render_checkpoints_without_data(id).await?;

        // get iteration numbers
        let total_iterations = render.config.parameters.total_checkpoints;
        let (completed_iterations, unstarted_iterations, progress_info) = match render.state {
            RenderState::Created => (0, total_iterations, None),
            RenderState::Running {
                checkpoint_iteration,
                progress_info,
            }
            | RenderState::Pausing {
                checkpoint_iteration,
                progress_info,
            } => (
                checkpoint_iteration - 1,
                total_iterations - checkpoint_iteration,
                Some(progress_info),
            ),
            RenderState::FinishedCheckpointIteration(iteration)
            | RenderState::Paused(iteration) => (iteration, total_iterations - iteration, None),
        };

        let (running_elapsed, running_estimated_remaining, active_progress) = match progress_info {
            Some(p) => (
                chrono::Duration::from_std(p.elapsed)
                    .expect("unable to coerce standard duration into chrono duration"),
                chrono::Duration::from_std(p.estimated_remaining)
                    .expect("unable to coerce standard duration into chrono duration"),
                p.progress,
            ),
            None => (chrono::Duration::zero(), chrono::Duration::zero(), 0.0),
        };

        // calculate the elapsed duration from previous checkpoint and the current running checkpoint
        let completed_elapsed_by_checkpoint = checkpoints_meta
            .iter()
            .filter(|c| c.iteration <= completed_iterations)
            .map(|c| c.ended_at - c.started_at)
            .collect::<Vec<chrono::Duration>>();
        let completed_elapsed = completed_elapsed_by_checkpoint
            .iter()
            .sum::<chrono::Duration>();
        let elapsed = completed_elapsed + running_elapsed;

        // calculate the estimated remaining time from the average runtime of previous checkpoints
        // and the estimated remaining time of the current running checkpoint
        let average_completed_elapsed = if completed_iterations > 0 {
            completed_elapsed / completed_iterations as i32
        } else {
            running_estimated_remaining + running_estimated_remaining
        };
        let unstarted_estimated_remaining =
            average_completed_elapsed * (unstarted_iterations) as i32;
        let estimated_remaining = running_estimated_remaining + unstarted_estimated_remaining;

        // calculate the total!
        let estimated_total = estimated_remaining + elapsed;

        let image_dimensions = render.config.parameters.image_dimensions;
        let samples_per_checkpoint = render.config.parameters.samples_per_checkpoint;
        let pixel_samples_per_checkpoint =
            samples_per_checkpoint as u64 * image_dimensions.0 as u64 * image_dimensions.1 as u64;
        let total_samples_taken: u64 = (pixel_samples_per_checkpoint as f64
            * (completed_iterations as f64 + active_progress))
            as u64;

        let to_std = |cd: &chrono::Duration, name: &str| {
            cd.to_std().map_err(|e| {
                format!(
                    "Cannot convert {} duration to standard duration: {}",
                    name, e
                )
            })
        };

        Ok(Some(RenderStats {
            image_dimensions,
            samples_per_checkpoint,
            completed_iterations,
            total_iterations,
            pixel_samples_per_checkpoint,
            total_samples_taken,
            elapsed: to_std(&elapsed, "elapsed")?,
            estimated_remaining: to_std(&estimated_remaining, "estimated remaining")?,
            estimated_total: to_std(&estimated_total, "estimated total")?,
            checkpoint_stats: RenderCheckpointStats {
                average_elapsed: to_std(&average_completed_elapsed, "average elapsed")?,
                max_elapsed: completed_elapsed_by_checkpoint
                    .iter()
                    .max()
                    .map(|d| to_std(&d, "max elapsed"))
                    .unwrap_or(Ok(Duration::from_secs(0)))?,
                min_elapsed: completed_elapsed_by_checkpoint
                    .iter()
                    .min()
                    .map(|d| to_std(&d, "min elapsed"))
                    .unwrap_or(Ok(Duration::from_secs(0)))?,
            },
        }))
    }

    pub async fn create_render(
        &self,
        render_config: RenderConfig,
        user: User,
    ) -> Result<Render, RenderManagerError> {
        let current_active_render_count = self.storage.get_render_count_for_user(user.id).await?;

        if user
            .max_renders
            .is_some_and(|max_renders| max_renders <= current_active_render_count)
        {
            return Err(RenderManagerError::ClientError(
                StatusCode::FORBIDDEN,
                "User has reached their maximum number of active renders".to_string(),
            ));
        }

        let dimensions = render_config.parameters.image_dimensions;
        let image_pixels = dimensions.0 * dimensions.1;
        if user
            .max_render_pixel_count
            .is_some_and(|max| max < image_pixels)
        {
            return Err(RenderManagerError::ClientError(
                StatusCode::FORBIDDEN,
                format!(
                    "Render is larger than the user's maximum allowed pixels (size: {}, limit: {})",
                    image_pixels,
                    user.max_render_pixel_count.unwrap()
                ),
            ));
        }

        let render_config = RenderConfigBuilder::from(render_config)
            .with_overriding_limits(&user)
            .with_builtins()
            .build();

        // compile for validation purposes
        if let Err(e) = render_config.compile() {
            return Err(RenderManagerError::ClientError(StatusCode::BAD_REQUEST, e));
        }

        let next_id = self.storage.get_next_id().await?;
        let render = Render::new(next_id, render_config, user.id);
        self.storage
            .create_render(render)
            .await
            .map_err(|e| e.into())
    }

    pub async fn get_earliest_render_checkpoint_iteration(
        &self,
        id: RenderID,
        user_id: UserID,
    ) -> Result<Option<u32>, RenderManagerError> {
        if !self.storage.render_exists(id).await? {
            return Ok(None);
        }

        if !self.storage.render_belongs_to(id, user_id).await? {
            return Err(RenderManagerError::ClientError(
                StatusCode::FORBIDDEN,
                "Forbidden".to_string(),
            ));
        }

        self.storage
            .get_earliest_render_checkpoint_iteration(id)
            .await
            .map_err(|e| e.into())
    }

    pub async fn get_latest_render_checkpoint_iteration(
        &self,
        id: RenderID,
        user_id: UserID,
    ) -> Result<Option<u32>, RenderManagerError> {
        if !self.storage.render_exists(id).await? {
            return Ok(None);
        }

        if !self.storage.render_belongs_to(id, user_id).await? {
            return Err(RenderManagerError::ClientError(
                StatusCode::FORBIDDEN,
                "Forbidden".to_string(),
            ));
        }

        self.storage
            .get_latest_render_checkpoint_iteration(id)
            .await
            .map_err(|e| e.into())
    }

    pub async fn get_render_checkpoint(
        &self,
        id: RenderID,
        iteration: u32,
        user_id: UserID,
    ) -> Result<Option<RenderCheckpoint>, RenderManagerError> {
        if !self.storage.render_exists(id).await? {
            return Ok(None);
        }

        if !self.storage.render_belongs_to(id, user_id).await? {
            return Err(RenderManagerError::ClientError(
                StatusCode::FORBIDDEN,
                "Forbidden".to_string(),
            ));
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
        user_id: UserID,
    ) -> Result<(), RenderManagerError> {
        if self.storage.render_exists(id).await?
            && !self.storage.render_belongs_to(id, user_id).await?
        {
            return Err(RenderManagerError::ClientError(
                StatusCode::FORBIDDEN,
                "Forbidden".to_string(),
            ));
        }

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

    pub async fn pause_render(
        &self,
        id: RenderID,
        user_id: UserID,
    ) -> Result<(), RenderManagerError> {
        // get render (which will also check permissions)
        let render = match self.get_render(id, user_id).await? {
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

    pub async fn resume_render(
        &self,
        id: RenderID,
        user_id: UserID,
    ) -> Result<(), RenderManagerError> {
        // get render (which will also check permissions)
        let render = match self.get_render(id, user_id).await? {
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

    pub async fn update_render_total_checkpoints(
        &self,
        id: RenderID,
        new_total_checkpoints: u32,
        user_id: UserID,
    ) -> Result<(), RenderManagerError> {
        // get render (which will also check permissions)
        let render = match self.get_render(id, user_id).await? {
            Some(r) => r,
            None => {
                return Err(RenderManagerError::ClientError(
                    StatusCode::NOT_FOUND,
                    "Render not found".to_string(),
                ));
            }
        };

        let current_iteration = match render.state {
            // created renders might be picked up immediately to work on the first iteration,
            // so, just to be safe, we'll say we're currently working on iteration 1
            RenderState::Created => 1,
            RenderState::Running {
                checkpoint_iteration,
                ..
            } => checkpoint_iteration,
            RenderState::FinishedCheckpointIteration(checkpoint_iteration) => {
                if checkpoint_iteration != render.config.parameters.total_checkpoints {
                    // similar to the created state, this may get picked up, so we should add 1
                    checkpoint_iteration + 1
                } else {
                    // otherwise, might as well allow it, since it's not gonna get picked up.
                    checkpoint_iteration
                }
            }
            RenderState::Pausing {
                checkpoint_iteration,
                ..
            } => checkpoint_iteration,
            RenderState::Paused(checkpoint_iteration) => checkpoint_iteration,
        };

        // make sure the new total is greater or equal to the current iteration of the render
        if new_total_checkpoints < current_iteration {
            return Err(RenderManagerError::ClientError(
                StatusCode::BAD_REQUEST,
                format!(
                    "New total_checkpoints ({}) must be greater than or equal to the current checkpoint iteration ({})",
                    new_total_checkpoints, current_iteration
                ),
            ));
        }

        // update render
        self.storage
            .update_render_total_checkpoints(id, new_total_checkpoints)
            .await
            .map_err(|e| e.into())
    }

    pub async fn get_render_checkpoint_as_image(
        &self,
        id: RenderID,
        iteration: u32,
        user_id: UserID,
    ) -> Result<Option<RgbaImage>, RenderManagerError> {
        // get render (which will also check permissions)
        let render = match self.get_render(id, user_id).await? {
            Some(r) => r,
            None => {
                return Err(RenderManagerError::ClientError(
                    StatusCode::NOT_FOUND,
                    "Render not found".to_string(),
                ));
            }
        };

        let params = render.config.parameters;

        let checkpoint = self.storage.get_render_checkpoint(id, iteration).await?;
        Ok(checkpoint.map(|rcp| rcp.as_image(&params)))
    }

    pub async fn get_render_checkpoint_storage_usage_bytes(
        &self,
        user: User,
    ) -> Result<u64, RenderManagerError> {
        // check if user is admin
        if user.role != Role::Admin {
            return Err(RenderManagerError::ClientError(
                StatusCode::FORBIDDEN,
                "Forbidden".to_string(),
            ));
        }

        self.storage
            .get_render_checkpoint_storage_usage_bytes()
            .await
            .map_err(|e| e.into())
    }
}

#[derive(Clone, Copy, Serialize)]
pub struct RenderStats {
    pub image_dimensions: (u32, u32),
    pub samples_per_checkpoint: u32,
    pub total_iterations: u32,
    pub completed_iterations: u32,
    pub pixel_samples_per_checkpoint: u64,
    pub total_samples_taken: u64,
    pub elapsed: Duration,
    pub estimated_remaining: Duration,
    pub estimated_total: Duration,
    pub checkpoint_stats: RenderCheckpointStats,
}

#[derive(Clone, Copy, Serialize)]
pub struct RenderCheckpointStats {
    pub average_elapsed: Duration,
    pub min_elapsed: Duration,
    pub max_elapsed: Duration,
}

pub enum RenderManagerError {
    ClientError(StatusCode, String),
    ServerError(String),
}

impl From<StorageError> for RenderManagerError {
    fn from(error: StorageError) -> Self {
        RenderManagerError::from(error.0)
    }
}

impl From<String> for RenderManagerError {
    fn from(value: String) -> Self {
        RenderManagerError::ServerError(value)
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
