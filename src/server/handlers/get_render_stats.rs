use axum::{
    Json,
    extract::{Path, State},
    http::StatusCode,
    response::{IntoResponse, Response},
};

use crate::{
    tracing::{RenderCheckpointStats, RenderID, RenderStats},
    utils::format_duration,
};

use super::LuxideState;

use serde::Serialize;

#[derive(Clone, Serialize)]
pub struct FormattedRenderStats {
    completed_iterations: u32,
    total_iterations: u32,
    elapsed: String,
    estimated_remaining: String,
    estimated_total: String,
    checkpoint_stats: FormattedRenderCheckpointStats,
}

impl From<RenderStats> for FormattedRenderStats {
    fn from(value: RenderStats) -> Self {
        Self {
            completed_iterations: value.completed_iterations,
            total_iterations: value.total_iterations,
            elapsed: format_duration(value.elapsed),
            estimated_remaining: format_duration(value.estimated_remaining),
            estimated_total: format_duration(value.estimated_total),
            checkpoint_stats: value.checkpoint_stats.into(),
        }
    }
}

#[derive(Clone, Serialize)]
pub struct FormattedRenderCheckpointStats {
    average_elapsed: String,
    min_elapsed: String,
    max_elapsed: String,
}

impl From<RenderCheckpointStats> for FormattedRenderCheckpointStats {
    fn from(value: RenderCheckpointStats) -> Self {
        Self {
            average_elapsed: format_duration(value.average_elapsed),
            min_elapsed: format_duration(value.min_elapsed),
            max_elapsed: format_duration(value.max_elapsed),
        }
    }
}

pub async fn get_render_stats(
    State(render_manager): LuxideState,
    Path(id): Path<RenderID>,
) -> Response {
    match render_manager.get_render_stats(id).await {
        Ok(Some(stats)) => {
            (StatusCode::OK, Json(FormattedRenderStats::from(stats))).into_response()
        }
        Ok(None) => StatusCode::NOT_FOUND.into_response(),
        Err(e) => e.into(),
    }
}
