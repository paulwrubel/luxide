use std::{
    num::NonZeroUsize,
    sync::{Arc, Mutex},
};

use image::RgbaImage;

use crate::{
    deserialization::RenderConfig,
    tracing::{PixelData, RenderState, Threads, Tracer},
    utils::Synchronizer,
};

use super::{Render, RenderCheckpoint, RenderID, RenderStorage};

#[derive(Clone)]
pub struct RenderManager<S: RenderStorage> {
    storage: Arc<S>,
    sync: Arc<Mutex<Synchronizer>>,
}

const POLLING_INTERVAL_MS: u64 = 1000;

impl<S: RenderStorage> RenderManager<S> {
    pub fn new(storage: Arc<S>) -> Self {
        Self {
            storage,
            sync: Arc::new(Mutex::new(Synchronizer::new())),
        }
    }

    pub fn start(&self) {
        loop {
            {
                println!("Polling renders...");

                let renders = {
                    self.sync
                        .lock()
                        .unwrap()
                        .block_on(self.storage.get_all_renders())
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
                    let previous_checkpoint = match render.state {
                        RenderState::FinishedCheckpointIteration(checkpoint) => self
                            .sync
                            .lock()
                            .unwrap()
                            .block_on(self.storage.get_render_checkpoint(render.id, checkpoint)),
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
        let storage: Arc<S> = Arc::clone(&self.storage);
        let sync = Arc::clone(&self.sync);

        rayon::spawn(move || {
            let tracer = Tracer::new(Threads::AllWithDefault(NonZeroUsize::new(24).unwrap()));

            let iteration = match previous_checkpoint {
                Some(ref rcp) => rcp.iteration + 1,
                None => 1,
            };

            match sync.lock().unwrap().block_on(
                storage
                    // .read().unwrap()
                    .update_render_state(
                        render.id,
                        RenderState::Running {
                            checkpoint_iteration: iteration,
                            progress_percent: 0.0,
                        },
                    ),
            ) {
                Err(e) => {
                    println!("Failed to update render state: {e}");
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

            println!("Rendering to checkpoint {iteration}");
            tracer.render_to_checkpoint_iteration(
                iteration,
                &mut initial_pixel_data,
                &render_data,
                2,
            );
            println!("Finished rendering to checkpoint {iteration}");

            println!("Saving pixel_data...");

            match sync.lock().unwrap().block_on(
                storage
                    // .read()
                    // .unwrap()
                    .create_render_checkpoint(RenderCheckpoint {
                        render_id: render.id,
                        iteration,
                        pixel_data: initial_pixel_data,
                    }),
            ) {
                Err(e) => {
                    println!("Failed to create render checkpoint: {e}");
                }
                Ok(_) => (),
            }

            println!("Finished saving pixel_data");

            match sync.lock().unwrap().block_on(
                storage
                    // .read().unwrap()
                    .update_render_state(
                        render.id,
                        RenderState::FinishedCheckpointIteration(iteration),
                    ),
            ) {
                Err(e) => {
                    println!("Failed to update render state: {e}");
                }
                Ok(_) => (),
            }
        });
    }

    pub async fn get_render(&self, id: RenderID) -> Option<Render> {
        self.storage.get_render(id).await
    }

    pub async fn get_all_renders(&self) -> Vec<Render> {
        self.storage.get_all_renders().await
    }

    pub async fn create_render(&self, render_config: RenderConfig) -> Result<Render, String> {
        // compile just for validation purposes
        if let Err(e) = render_config.compile() {
            return Err(e.to_string());
        }

        let render = Render::new(self.storage.get_next_id().await, render_config);

        self.storage.create_render(render).await
    }

    pub async fn get_render_checkpoint(
        &self,
        id: RenderID,
        iteration: u32,
    ) -> Option<RenderCheckpoint> {
        self.storage.get_render_checkpoint(id, iteration).await
    }

    pub async fn get_render_checkpoint_as_image(
        &self,
        id: RenderID,
        iteration: u32,
    ) -> Option<RgbaImage> {
        let params = self.storage.get_render(id).await?.config.parameters;

        match self.storage.get_render_checkpoint(id, iteration).await {
            Some(rcp) => Some(rcp.as_image(&params)),
            None => None,
        }
    }
}
