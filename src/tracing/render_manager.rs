use std::{
    num::NonZeroUsize,
    sync::{Arc, Mutex, mpsc},
};

use image::RgbaImage;

use crate::{
    deserialization::RenderConfig,
    tracing::{PixelData, RenderState, Threads, Tracer},
    utils::{ProgressInfo, ProgressTracker, Synchronizer},
};

use super::{Render, RenderCheckpoint, RenderID, RenderStorage, RenderStorageError};

use std::collections::HashSet;

#[derive(Clone)]
pub struct RenderManager<S: RenderStorage> {
    storage: Arc<S>,
    sync: Arc<Mutex<Synchronizer>>,
    running_renders: Arc<Mutex<HashSet<RenderID>>>,
}

const POLLING_INTERVAL_MS: u64 = 1000;

impl<S: RenderStorage> RenderManager<S> {
    pub async fn new(storage: Arc<S>) -> Result<Self, RenderStorageError> {
        // find any renders that were left in Running state
        let running_renders = storage.find_running_renders().await?;

        // revert them to their last checkpoint
        for render in running_renders {
            println!(
                "Reverting interrupted render {} to last checkpoint",
                render.id
            );
            storage.revert_to_last_checkpoint(render.id).await?;
        }

        Ok(Self {
            storage,
            sync: Arc::new(Mutex::new(Synchronizer::new())),
            running_renders: Arc::new(Mutex::new(HashSet::new())),
        })
    }

    pub fn start(&self) {
        loop {
            {
                println!("Polling renders...");

                let renders = {
                    match self
                        .sync
                        .lock()
                        .unwrap()
                        .block_on(self.storage.get_all_renders())
                    {
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
                    self.spawn_tracer_thread_to_next_checkpoint(render, None);
                }

                // move FinishedCheckpoint renders to next checkpoint if applicable
                let checkpointed_renders = renders.iter().filter(|r| match r.state {
                    RenderState::FinishedCheckpointIteration(checkpoint) => {
                        checkpoint < r.config.parameters.checkpoints
                    }
                    _ => false,
                });
                for render in checkpointed_renders.cloned() {
                    let previous_checkpoint =
                        match render.state {
                            RenderState::FinishedCheckpointIteration(checkpoint) => {
                                match self.sync.lock().unwrap().block_on(
                                    self.storage.get_render_checkpoint(render.id, checkpoint),
                                ) {
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

                    self.spawn_tracer_thread_to_next_checkpoint(render, previous_checkpoint);
                }
            }

            // sleep until time to poll again
            std::thread::sleep(std::time::Duration::from_millis(POLLING_INTERVAL_MS));
        }
    }

    fn spawn_tracer_thread_to_next_checkpoint(
        &self,
        render: Render,
        previous_checkpoint: Option<RenderCheckpoint>,
    ) {
        // add render to running set
        self.running_renders.lock().unwrap().insert(render.id);

        let running_renders = Arc::clone(&self.running_renders);
        let storage: Arc<S> = Arc::clone(&self.storage);
        let sync = Arc::clone(&self.sync);

        rayon::spawn(move || {
            let tracer = Tracer::new(Threads::AllWithDefault(NonZeroUsize::new(24).unwrap()));

            let iteration = match previous_checkpoint {
                Some(ref rcp) => rcp.iteration + 1,
                None => 1,
            };

            match sync.lock().unwrap().block_on(storage.update_render_state(
                render.id,
                RenderState::Running {
                    checkpoint_iteration: iteration,
                    progress_info: ProgressInfo::default(),
                },
            )) {
                Err(e) => {
                    println!("Failed to update render state: {e}");
                    // remove from running set on error
                    running_renders.lock().unwrap().remove(&render.id);
                    return;
                }
                Ok(_) => (),
            }

            let mut initial_pixel_data = match previous_checkpoint {
                Some(rcp) => rcp.pixel_data,
                None => PixelData::new(),
            };

            let render_data = render
                .config
                .compile()
                .expect("Failing to compile render config at tracing time!");

            let (sender, receiver) = mpsc::channel();

            let (width, height) = render.config.parameters.image_dimensions;

            // let start: Instant = Instant::now();
            // let total = width * height;
            // let batch_size = 100;
            // let memory = 50;
            {
                let storage: Arc<S> = Arc::clone(&storage);
                let sync = Arc::clone(&sync);

                rayon::join(
                    || {
                        // let storage_3: Arc<S> = Arc::clone(&storage_2);
                        let update_fn = storage.get_update_progress_fn(render.id);

                        let total = u64::from(width) * u64::from(height);
                        let mut progress_tracker = ProgressTracker::new(
                            total,
                            50,
                            (total / 1000).max(1),
                            move |progress_info| {
                                sync.lock().unwrap().block_on(update_fn(progress_info));
                            },
                        );
                        // let mut current = 0;
                        for _ in receiver {
                            progress_tracker.mark();
                            // current += 1;
                            // if current % batch_size == 0 || current == total {
                            //     let progress_info = progress_tracker.progress_info(current);
                            // let progress_string = utils::progress_string(
                            //     &mut instants,
                            //     current,
                            //     batch_size,
                            //     total,
                            //     start,
                            //     memory,
                            // );
                            // print!(
                            //     "\r{}{}{}",
                            //     " ".repeat(indentation),
                            //     progress_string,
                            //     " ".repeat(10)
                            // );
                            // stdout().flush().unwrap();
                        }
                    },
                    || {
                        println!("Rendering to checkpoint {iteration}");
                        tracer.render_to_checkpoint_iteration(
                            iteration,
                            &mut initial_pixel_data,
                            &render_data,
                            sender,
                        );
                        println!("Finished rendering to checkpoint {iteration}");
                    },
                );
            }

            println!("Saving pixel_data...");

            match sync
                .lock()
                .unwrap()
                .block_on(storage.create_render_checkpoint(RenderCheckpoint {
                    render_id: render.id,
                    iteration,
                    pixel_data: initial_pixel_data,
                })) {
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
            let current_state = match sync.lock().unwrap().block_on(storage.get_render(render.id)) {
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
                    match sync.lock().unwrap().block_on(storage.update_render_state(
                        render.id,
                        RenderState::FinishedCheckpointIteration(iteration),
                    )) {
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
                    match sync.lock().unwrap().block_on(
                        storage.update_render_state(render.id, RenderState::Paused(iteration)),
                    ) {
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
    }

    pub async fn get_render(&self, id: RenderID) -> Result<Option<Render>, RenderStorageError> {
        self.storage.get_render(id).await
    }

    pub async fn get_all_renders(&self) -> Result<Vec<Render>, RenderStorageError> {
        self.storage.get_all_renders().await
    }

    pub async fn create_render(
        &self,
        render_config: RenderConfig,
    ) -> Result<Render, RenderStorageError> {
        // compile just for validation purposes
        if let Err(e) = render_config.compile() {
            return Err(e.to_string());
        }

        let next_id = self.storage.get_next_id().await?;
        let render = Render::new(next_id, render_config);
        self.storage.create_render(render).await
    }

    pub async fn get_render_checkpoint(
        &self,
        id: RenderID,
        iteration: u32,
    ) -> Result<Option<RenderCheckpoint>, RenderStorageError> {
        self.storage.get_render_checkpoint(id, iteration).await
    }

    pub async fn delete_render_and_checkpoints(
        &self,
        id: RenderID,
    ) -> Result<(), RenderStorageError> {
        // check if render is running
        let is_running = self.running_renders.lock().unwrap().contains(&id);
        if is_running {
            return Err("Cannot delete a render while it is running".to_string());
        }

        // delete the render and its checkpoints
        self.storage.delete_render_and_checkpoints(id).await
    }

    pub async fn pause_render(&self, id: RenderID) -> Result<(), RenderStorageError> {
        // get current state
        let render = match self.get_render(id).await? {
            Some(r) => r,
            None => return Err(format!("Render {id} not found")),
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
            }
            _ => Err(format!(
                "Cannot pause render {id} in state {:?}",
                render.state
            )),
        }
    }

    pub async fn get_render_checkpoint_as_image(
        &self,
        id: RenderID,
        iteration: u32,
    ) -> Result<Option<RgbaImage>, RenderStorageError> {
        let render = self.storage.get_render(id).await?;
        let params = match render {
            Some(r) => r.config.parameters,
            None => return Ok(None),
        };

        let checkpoint = self.storage.get_render_checkpoint(id, iteration).await?;
        Ok(checkpoint.map(|rcp| rcp.as_image(&params)))
    }
}
