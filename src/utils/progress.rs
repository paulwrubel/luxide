use std::{
    collections::VecDeque,
    time::{Duration, Instant},
};

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

pub fn progress_string(
    instants: &mut VecDeque<Instant>,
    current: u32,
    batch_size: u32,
    total: u32,
    start: Instant,
    memory: usize,
) -> String {
    let progress = current as f64 / total as f64;
    let elapsed_duration = start.elapsed();

    let now = Instant::now();
    instants.push_front(now);
    if instants.len() > memory {
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
        "{:>5.1}% done... [{} elapsed, est. {}/{} remaining]",
        progress * 100.0,
        format_duration(elapsed_duration),
        format_duration(estimated_remaining_duration),
        format_duration(estimated_total_duration),
    )
}
