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
pub enum RenderJobState {
    Created,
    RunningToCheckpoint(u64),
    FinishedCheckpoint(u64),
}

#[derive(Debug, Clone, Serialize)]
pub struct RenderJobInfo {
    name: String,
    state: RenderJobState,
    progress: f64,
    parameters: RenderParameters,
}

#[derive(Clone)]
pub struct RenderJob {
    pub state: Arc<RwLock<RenderJobState>>,
    pub render_data: RenderData,
    pub pixel_data: Arc<Mutex<PixelData>>,
    pub progress: f64,
}

impl RenderJob {
    fn new(render_data: RenderData) -> Self {
        Self {
            state: Arc::new(RwLock::new(RenderJobState::Created)),
            render_data,
            pixel_data: Arc::new(Mutex::new(PixelData::new())),
            progress: 0.0,
        }
    }

    fn info(&self) -> RenderJobInfo {
        RenderJobInfo {
            name: self.render_data.scene.name.clone(),
            state: self.state.read().expect("RwLock is poisoned").clone(),
            progress: self.progress,
            parameters: self.render_data.parameters,
        }
    }
}

#[derive(Clone)]
pub struct RenderJobManager {
    jobs: Arc<RwLock<HashMap<u64, Arc<RwLock<RenderJob>>>>>,
}

const POLLING_INTERVAL_MS: u64 = 1000;

impl RenderJobManager {
    pub fn new() -> Self {
        Self {
            jobs: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    pub fn start(&self) {
        loop {
            {
                println!("Polling jobs...");

                // borrow jobs statically
                let jobs = self.jobs.read().expect("mutex is poisoned");

                // move Created jobs to Running
                let created_jobs = jobs.iter().filter(|(_, j)| {
                    *j.read().unwrap().state.read().unwrap() == RenderJobState::Created
                });

                for (id, job) in created_jobs {
                    let job_copy = job.clone();
                    let id = *id;

                    rayon::spawn(move || {
                        let tracer =
                            Tracer::new(Threads::AllWithDefault(NonZeroUsize::new(24).unwrap()));

                        let job_read = job_copy.read().unwrap();
                        let mut pixel_data = job_read.pixel_data.lock().unwrap();

                        let render_data_copy = job_copy.read().unwrap().render_data.clone();

                        {
                            let mut state = job_read.state.write().unwrap();

                            *state = RenderJobState::RunningToCheckpoint(1);
                            println!("MOVING JOB {} TO STATE: RunningToCheckpoint(1)", id);
                        }

                        println!("Rendering to checkpoint 1");
                        tracer.render_to_checkpoint(1, &mut pixel_data, &render_data_copy, 2);
                        println!("Finished rendering to checkpoint 1");

                        {
                            let mut state = job_read.state.write().unwrap();

                            *state = RenderJobState::FinishedCheckpoint(1);
                            println!("MOVING JOB {} TO STATE: FinishedCheckpoint(1)", id);
                        }
                    });
                }
            }

            // sleep until time to poll again
            std::thread::sleep(std::time::Duration::from_millis(POLLING_INTERVAL_MS));
        }
    }

    pub fn get_all_job_info(&self) -> HashMap<u64, RenderJobInfo> {
        self.jobs
            .read()
            .unwrap()
            .iter()
            .map(|(id, job)| (*id, job.read().unwrap().info()))
            .collect()
    }

    pub fn get_job_info(&self, id: u64) -> Option<RenderJobInfo> {
        self.jobs
            .read()
            .unwrap()
            .get(&id)
            .map(|job| job.read().unwrap().info())
    }

    pub fn create_job(&self, render_data: RenderData) -> (u64, RenderJobInfo) {
        // let id = self.get_next_id();

        // println!("Jobs: {:#?}", self.jobs);

        // let mut tracer = Tracer::new(Threads::AllWithDefault(NonZeroUsize::new(24).unwrap()));

        // tokio::task::spawn_blocking(move || match tracer.render(&render_data, 2) {
        //     Ok(()) => {
        //         println!("Job {} finished", id);
        //     }
        //     Err(e) => {
        //         println!("Job {} failed: {}", id, e);
        //     }
        // });

        let id = self.get_next_id();

        let job = RenderJob::new(render_data);
        let job_info = job.info();
        println!("Creating job with id: {}", id);

        {
            self.jobs
                .write()
                .unwrap()
                .insert(id, Arc::new(RwLock::new(job)));
        }

        // println!("NEW Jobs: {:#?}", self.jobs);

        (id, job_info)
    }

    fn get_next_id(&self) -> u64 {
        match self.jobs.read().unwrap().keys().max() {
            Some(id) => id + 1,
            None => 1,
        }
    }
}
