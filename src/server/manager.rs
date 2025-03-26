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
    pub state: RenderJobState,
    pub render_data: RenderData,
    pub pixel_data: Arc<Mutex<PixelData>>,
    pub progress: f64,
}

impl RenderJob {
    fn new(render_data: RenderData) -> Self {
        Self {
            state: RenderJobState::Created,
            render_data,
            pixel_data: Arc::new(Mutex::new(PixelData::new())),
            progress: 0.0,
        }
    }

    fn info(&self) -> RenderJobInfo {
        RenderJobInfo {
            name: self.render_data.scene.name.clone(),
            state: self.state,
            progress: self.progress,
            parameters: self.render_data.parameters,
        }
    }
}

impl Into<RenderJobInfo> for RenderJob {
    fn into(self) -> RenderJobInfo {
        RenderJobInfo {
            name: self.render_data.scene.name,
            state: self.state,
            progress: self.progress,
            parameters: self.render_data.parameters,
        }
    }
}

#[derive(Clone)]
pub struct RenderJobManager {
    jobs: Arc<RwLock<HashMap<u64, RenderJob>>>,
}

const POLLING_INTERVAL_MS: u64 = 50;

impl RenderJobManager {
    pub fn new() -> Self {
        Self {
            jobs: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    pub fn start(&mut self) {
        loop {
            {
                println!("Polling jobs...");
                // let mut job = self.jobs.lock().expect("mutex is poisoned");

                // let local_jobs = self.jobs.clone();

                // borrow jobs statically
                let mut jobs = self.jobs.write().expect("mutex is poisoned");

                // move Created jobs to Running
                let created_jobs = jobs
                    .iter_mut()
                    .filter(|(_, j)| j.state == RenderJobState::Created);

                for (id, job) in created_jobs {
                    let pixel_data_copy = job.pixel_data.clone();
                    let render_data_copy = job.render_data.clone();

                    rayon::spawn(move || {
                        let tracer =
                            Tracer::new(Threads::AllWithDefault(NonZeroUsize::new(24).unwrap()));

                        let mut pixel_data = pixel_data_copy.lock().expect("mutex is poisoned");

                        // let mut pixel_data = job.pixel_data.clone();

                        println!("Rendering to checkpoint 1");
                        tracer.render_to_checkpoint(1, &mut pixel_data, &render_data_copy, 2);
                        println!("Finished rendering to checkpoint 1");
                    });

                    job.state = RenderJobState::RunningToCheckpoint(1);
                    println!("MOVING JOB {} TO STATE: RUNNING", id);
                }

                // move Runn
            }

            // sleep until time to poll again
            std::thread::sleep(std::time::Duration::from_millis(POLLING_INTERVAL_MS));
        }
    }

    pub fn get_all_job_info(&self) -> HashMap<u64, RenderJobInfo> {
        self.jobs
            .read()
            .expect("mutex is poisoned")
            .iter()
            .map(|(id, job)| (*id, job.info()))
            .collect()
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
                .expect("mutex is poisoned")
                .insert(id, job);
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
