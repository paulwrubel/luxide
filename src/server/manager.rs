use std::{
    num::NonZeroUsize,
    sync::{Arc, Mutex},
};

use serde::Serialize;

use crate::{
    deserialization::CompiledRenderData,
    tracing::{Threads, Tracer},
};

#[derive(Debug, Clone, Copy, Serialize)]
pub struct RenderJobInfo {
    id: u64,
    progress: f64,
}

#[derive(Debug, Clone)]
pub struct RenderJobManager {
    jobs: Arc<Mutex<Vec<RenderJobInfo>>>,
}

impl RenderJobManager {
    pub fn new() -> Self {
        Self {
            jobs: Arc::new(Mutex::new(Vec::new())),
        }
    }

    pub fn create_job(&self, render_data: CompiledRenderData) -> RenderJobInfo {
        let id = self.get_next_id();

        println!("Creating job with id {}", id);
        println!("Jobs: {:#?}", self.jobs);

        let mut tracer = Tracer::new(Threads::AllWithDefault(NonZeroUsize::new(24).unwrap()));

        tokio::task::spawn_blocking(move || match tracer.render(&render_data, 2) {
            Ok(()) => {
                println!("Job {} finished", id);
            }
            Err(e) => {
                println!("Job {} failed: {}", id, e);
            }
        });

        let job_info = RenderJobInfo { id, progress: 0.0 };
        {
            self.jobs.lock().expect("mutex is poisoned").push(job_info);
        }

        println!("NEW Jobs: {:#?}", self.jobs);

        job_info
    }

    fn get_next_id(&self) -> u64 {
        match self.jobs.lock().unwrap().iter().map(|j| j.id).max() {
            Some(id) => id + 1,
            None => 1,
        }
    }
}
