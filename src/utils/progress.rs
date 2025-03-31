use std::{
    collections::VecDeque,
    time::{Duration, Instant},
};

use serde::{Deserialize, Serialize};

#[derive(Debug, Copy, Clone, Serialize, Deserialize)]
pub struct ProgressInfo {
    progress: f64,
    elapsed: Duration,
    estimated_remaining: Duration,
    estimated_total: Duration,
}

impl ProgressInfo {
    pub fn default() -> Self {
        Self {
            progress: 0.0,
            elapsed: Duration::from_secs(0),
            estimated_remaining: Duration::from_secs(0),
            estimated_total: Duration::from_secs(0),
        }
    }
}

impl From<ProgressInfo> for String {
    fn from(info: ProgressInfo) -> Self {
        format!(
            "{:>5.1}% done... [{} elapsed, est. {}/{} remaining]",
            info.progress * 100.0,
            format_duration(info.elapsed),
            format_duration(info.estimated_remaining),
            format_duration(info.estimated_total),
        )
    }
}

pub struct ProgressTracker<'a> {
    instants: VecDeque<Instant>,
    current: u64,
    total: u64,
    start: Instant,
    memory: usize,
    update_interval: u64,
    update_fn: Box<dyn Fn(ProgressInfo) + 'a>,
}

impl<'a> ProgressTracker<'a> {
    pub fn new(
        total: u64,
        memory: usize,
        update_interval: u64,
        update_fn: impl Fn(ProgressInfo) + 'a,
    ) -> Self {
        Self {
            instants: VecDeque::with_capacity(memory),
            current: 0,
            total,
            start: Instant::now(),
            memory,
            update_interval,
            update_fn: Box::new(update_fn),
        }
    }

    pub fn mark(&mut self) {
        self.current += 1;
        if self.current % self.update_interval == 0 || self.current == self.total {
            self.push_instant();
            (self.update_fn)(self.get_progress_info());
        }
    }

    fn push_instant(&mut self) {
        let now = Instant::now();
        self.instants.push_front(now);
        if self.instants.len() > self.memory {
            self.instants.pop_back();
        }
    }

    fn get_progress_info(&self) -> ProgressInfo {
        let progress = self.current as f64 / self.total as f64;
        let elapsed = self.start.elapsed();

        let mut averaged_increment_duration = Duration::new(0, 0);
        for i in (0..self.instants.len() - 1).rev() {
            let increment_duration = self.instants[i].duration_since(self.instants[i + 1]);
            averaged_increment_duration += increment_duration / (self.instants.len() - 1) as u32;
        }

        let estimated_remaining = averaged_increment_duration
            .mul_f64((self.total - self.current) as f64 / self.update_interval as f64);
        let estimated_total = elapsed + estimated_remaining;

        ProgressInfo {
            progress,
            elapsed,
            estimated_remaining,
            estimated_total,
        }
    }
}

pub fn format_duration(d: Duration) -> String {
    let mut s = String::new();

    let hours = d.as_secs() / 3600;
    if hours > 0 {
        s.push_str(&format!("{}h", hours));
    }

    let minutes = (d.as_secs() % 3600) / 60;
    if minutes > 0 {
        s.push_str(&format!("{}m", minutes));
    }

    let seconds = d.as_secs_f64() % 60.0;
    if seconds > 0.0 {
        s.push_str(&format!("{:>.1}s", seconds));
    }

    s
}
