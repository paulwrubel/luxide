use std::{
    collections::HashMap,
    num::NonZeroUsize,
    sync::{Arc, Mutex, RwLock},
};

use serde::Serialize;

use crate::{
    deserialization::RenderData,
    tracing::{PixelData, RenderParameters, Threads, Tracer},
};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
pub enum RenderState {
    Created,
    RunningToCheckpoint(u64),
    FinishedCheckpoint(u64),
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
                let created_renders = renders.iter().filter(|(_, j)| {
                    *j.read().unwrap().state.read().unwrap() == RenderState::Created
                });

                for (id, render) in created_renders {
                    let render_copy = render.clone();
                    let id = *id;

                    rayon::spawn(move || {
                        let tracer =
                            Tracer::new(Threads::AllWithDefault(NonZeroUsize::new(24).unwrap()));

                        let render_read = render_copy.read().unwrap();
                        let mut pixel_data = { render_read.pixel_data.lock().unwrap().clone() };

                        println!("Cloning pixel_data...");
                        let render_data_copy = render_copy.read().unwrap().render_data.clone();
                        println!("Finished cloning pixel_data...");

                        {
                            let mut state = render_read.state.write().unwrap();

                            *state = RenderState::RunningToCheckpoint(1);
                            println!("MOVING JOB {} TO STATE: RunningToCheckpoint(1)", id);
                        }

                        println!("Rendering to checkpoint 1");
                        tracer.render_to_checkpoint(1, &mut pixel_data, &render_data_copy, 2);
                        println!("Finished rendering to checkpoint 1");

                        println!("Saving pixel_data...");
                        {
                            let mut render_pixel_data = render_read.pixel_data.lock().unwrap();
                            *render_pixel_data = pixel_data;
                        }
                        println!("Finished saving pixel_data");

                        {
                            let mut state = render_read.state.write().unwrap();

                            *state = RenderState::FinishedCheckpoint(1);
                            println!("MOVING JOB {} TO STATE: FinishedCheckpoint(1)", id);
                        }
                    });
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

    fn get_next_id(&self) -> u64 {
        match self.renders.read().unwrap().keys().max() {
            Some(id) => id + 1,
            None => 1,
        }
    }
}
