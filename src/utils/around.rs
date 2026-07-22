use std::sync::Arc;

use serde::{Deserialize, Serialize};

use crate::geometry::{Geometric, Point};

/// Pivot point for rotation geometrics.
///
/// Serializes as either a string (`"center"` or `"origin"`) or a 3-element array (`[x, y, z]`).
#[derive(Debug, Copy, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Around {
    /// Rotate around the child geometric's center point (computed at build time)
    Center,
    /// Rotate around the world origin `[0.0, 0.0, 0.0]`
    Origin,
    /// Rotate around an explicit custom point
    Point([f64; 3]),
}

impl Around {
    pub fn point(&self, geometric: &Arc<dyn Geometric>) -> Point {
        match self {
            Around::Center => geometric.center(),
            Around::Origin => Point::ORIGIN,
            Around::Point(p) => (*p).into(),
        }
    }
}

