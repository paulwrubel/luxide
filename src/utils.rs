use std::{
    collections::VecDeque,
    f64::consts::PI,
    time::{Duration, Instant},
};

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Interval {
    pub minimum: f64,
    pub maximum: f64,
}

impl Interval {
    pub const EMPTY: Self = Self {
        minimum: f64::INFINITY,
        maximum: f64::NEG_INFINITY,
    };

    pub const UNIVERSE: Self = Self {
        minimum: f64::NEG_INFINITY,
        maximum: f64::INFINITY,
    };

    pub fn new(minimum: f64, maximum: f64) -> Self {
        Self { minimum, maximum }
    }

    pub fn from_intervals(a: Self, b: Self) -> Self {
        Self {
            minimum: a.minimum.min(b.minimum),
            maximum: a.maximum.max(b.maximum),
        }
    }

    pub fn size(&self) -> f64 {
        self.maximum - self.minimum
    }

    pub fn expand(&self, delta: f64) -> Self {
        let padding = delta / 2.0;
        Self {
            minimum: self.minimum - padding,
            maximum: self.maximum + padding,
        }
    }

    pub fn contains_including(&self, x: f64) -> bool {
        self.minimum <= x && x <= self.maximum
    }

    pub fn contains_excluding(&self, x: f64) -> bool {
        self.minimum < x && x < self.maximum
    }

    pub fn clamp(&self, x: f64) -> f64 {
        if x < self.minimum {
            self.minimum
        } else if x > self.maximum {
            self.maximum
        } else {
            x
        }
    }
}

fn format_duration(d: Duration) -> String {
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

const MAX_PROGRESS_INSTANTS: usize = 10;

pub fn progress_string(
    instants: &mut VecDeque<Instant>,
    current: u32,
    batch_size: u32,
    total: u32,
    start: Instant,
) -> String {
    let progress = current as f64 / total as f64;
    let elapsed_duration = start.elapsed();

    let now = Instant::now();
    instants.push_front(now);
    if instants.len() > MAX_PROGRESS_INSTANTS {
        instants.pop_back();
    }
    let mut averaged_increment_duration = Duration::new(0, 0);
    for i in (0..instants.len() - 1).rev() {
        let increment_duration = instants[i].duration_since(instants[i + 1]);
        averaged_increment_duration += increment_duration / (instants.len() - 1) as u32;
    }

    let estimated_remaining_duration =
        averaged_increment_duration.mul_f64((total - current) as f64 / batch_size as f64);
    let estimated_total_duration = elapsed_duration + estimated_remaining_duration;

    format!(
        "{:>6.1}% done... [{} elapsed, est. {}/{} remaining]",
        progress * 100.0,
        format_duration(elapsed_duration),
        format_duration(estimated_remaining_duration),
        format_duration(estimated_total_duration),
    )
}

pub struct Degrees(pub f64);

impl Degrees {
    pub fn as_radians(&self) -> f64 {
        self.0 * (PI / 180.0)
    }
}

pub struct Radians(f64);

impl Radians {
    pub fn as_degrees(&self) -> f64 {
        self.0 * (180.0 / PI)
    }
}
