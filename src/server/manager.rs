use std::{
    collections::HashMap,
    num::NonZeroUsize,
    sync::{Arc, Mutex, RwLock},
};

use image::RgbaImage;
use serde::Serialize;

use crate::{
    deserialization::RenderData,
    tracing::{PixelData, RenderParameters, Threads, Tracer},
};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum RenderState {
    Created,
    RunningToCheckpoint(u32),
    FinishedCheckpoint(u32),
}

#[derive(Debug, Clone, Serialize)]
pub struct RenderInfo {
    name: String,
    state: RenderState,
    progress: f64,
    parameters: RenderParameters,
}

#[derive(Clone)]
struct Render {
    state: Arc<RwLock<RenderState>>,
    render_data: RenderData,
    pixel_data: Arc<Mutex<PixelData>>,
    progress: f64,
}

impl Render {
    fn new(render_data: RenderData) -> Self {
        Self {
            state: Arc::new(RwLock::new(RenderState::Created)),
            render_data,
            pixel_data: Arc::new(Mutex::new(PixelData::new())),
            progress: 0.0,
        }
    }

    fn info(&self) -> RenderInfo {
        RenderInfo {
            name: self.render_data.scene.name.clone(),
            state: self.state.read().expect("RwLock is poisoned").clone(),
            progress: self.progress,
            parameters: self.render_data.parameters,
        }
    }
}

#[derive(Clone)]
pub struct RenderManager {
    renders: Arc<RwLock<HashMap<u64, Arc<RwLock<Render>>>>>,
}

const POLLING_INTERVAL_MS: u64 = 1000;

impl RenderManager {
    pub fn new() -> Self {
        Self {
            renders: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    pub fn start(&self) {
        loop {
            {
                println!("Polling renders...");

                // borrow renders statically
                let renders = self.renders.read().expect("mutex is poisoned");

                // move Created renders to Running
                let created_renders = renders.iter().filter(|(_, r)| {
                    let r = r.read().unwrap();
                    *r.state.read().unwrap() == RenderState::Created
                        && r.render_data.parameters.checkpoints > 0
                });
                for (id, render) in created_renders {
                    let render_copy = render.clone();
                    let id = *id;

                    self.execute_tracer_to_checkpoint(render_copy, id, 1);
                }

                // move FinishedCheckpoint renders to next checkpoint if applicable
                let checkpointed_renders = renders.iter().filter(|(_, r)| {
                    let r = r.read().unwrap();
                    let state = *r.state.read().unwrap();
                    match state {
                        RenderState::FinishedCheckpoint(checkpoint) => {
                            checkpoint < r.render_data.parameters.checkpoints
                        }
                        _ => false,
                    }
                });
                for (id, render) in checkpointed_renders {
                    let render_copy = render.clone();
                    let id = *id;

                    let next_checkpoint = {
                        let render = render.read().unwrap();
                        let state = *render.state.read().unwrap();
                        match state {
                            RenderState::FinishedCheckpoint(checkpoint) => checkpoint + 1,
                            _ => panic!("RenderState is not FinishedCheckpoint"),
                        }
                    };

                    self.execute_tracer_to_checkpoint(render_copy, id, next_checkpoint);
                }
            }

            // sleep until time to poll again
            std::thread::sleep(std::time::Duration::from_millis(POLLING_INTERVAL_MS));
        }
    }

    pub fn get_all_render_info(&self) -> HashMap<u64, RenderInfo> {
        self.renders
            .read()
            .unwrap()
            .iter()
            .map(|(id, render)| (*id, render.read().unwrap().info()))
            .collect()
    }

    pub fn get_render_info(&self, id: u64) -> Option<RenderInfo> {
        self.renders
            .read()
            .unwrap()
            .get(&id)
            .map(|render| render.read().unwrap().info())
    }

    pub fn get_render_image(&self, id: u64) -> Option<RgbaImage> {
        let renders_read = self.renders.read().unwrap();
        let render = match renders_read.get(&id) {
            Some(render) => render,
            None => return None,
        };

        let render = render.read().unwrap();
        let params = &render.render_data.parameters;

        // we have to turn our pixel_data into an image
        let (width, height) = params.image_dimensions;
        let mut img = RgbaImage::new(width, height);

        {
            let pixel_data = render.pixel_data.lock().unwrap();

            for ((x, y), color) in pixel_data.iter() {
                let pixel = img.get_pixel_mut(*x, *y);
                *pixel = if params.use_scaling_truncation {
                    color
                        .scale_down(1.0)
                        .as_gamma_corrected_rgba_u8(1.0 / params.gamma_correction)
                } else {
                    color.as_gamma_corrected_rgba_u8(1.0 / params.gamma_correction)
                }
            }
        }

        Some(img)
    }

    pub fn create_render(&self, render_data: RenderData) -> (u64, RenderInfo) {
        let id = self.get_next_id();

        let render = Render::new(render_data);
        let render_info = render.info();
        println!("Creating render with id: {}", id);

        {
            self.renders
                .write()
                .unwrap()
                .insert(id, Arc::new(RwLock::new(render)));
        }

        (id, render_info)
    }

    fn execute_tracer_to_checkpoint(&self, render: Arc<RwLock<Render>>, id: u64, checkpoint: u32) {
        rayon::spawn(move || {
            let tracer = Tracer::new(Threads::AllWithDefault(NonZeroUsize::new(24).unwrap()));

            let render_read = render.read().unwrap();
            let mut pixel_data = { render_read.pixel_data.lock().unwrap().clone() };

            println!("Cloning pixel_data...");
            let render_data_copy = render.read().unwrap().render_data.clone();
            println!("Finished cloning pixel_data...");

            {
                let mut state = render_read.state.write().unwrap();

                *state = RenderState::RunningToCheckpoint(checkpoint);
                println!(
                    "MOVING JOB {} TO STATE: RunningToCheckpoint({})",
                    id, checkpoint
                );
            }

            println!("Rendering to checkpoint {checkpoint}");
            tracer.render_to_checkpoint(checkpoint, &mut pixel_data, &render_data_copy, 2);
            println!("Finished rendering to checkpoint {checkpoint}");

            println!("Saving pixel_data...");
            {
                let mut render_pixel_data = render_read.pixel_data.lock().unwrap();
                *render_pixel_data = pixel_data;
            }
            println!("Finished saving pixel_data");

            {
                let mut state = render_read.state.write().unwrap();

                *state = RenderState::FinishedCheckpoint(checkpoint);
                println!(
                    "MOVING JOB {} TO STATE: FinishedCheckpoint({})",
                    id, checkpoint
                );
            }
        });
    }

    fn get_next_id(&self) -> u64 {
        match self.renders.read().unwrap().keys().max() {
            Some(id) => id + 1,
            None => 1,
        }
    }
}
