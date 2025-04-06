use axum::{
    Json,
    extract::{Path, State},
    http::StatusCode,
    response::{IntoResponse, Response},
};

use crate::tracing::RenderID;
use serde::{Deserialize, Serialize};

use super::LuxideState;

#[derive(Clone, Copy, Serialize, Deserialize)]
pub struct UpdateRenderTotalCheckpoints {
    new_total_checkpoints: u32,
}

pub async fn update_render_total_checkpoints(
    State(render_manager): LuxideState,
    Path(id): Path<RenderID>,
    Json(update_render_total_checkpoints): Json<UpdateRenderTotalCheckpoints>,
) -> Response {
    println!(
        "Handing request for update_render_total_checkpoints (id: {})...",
        id
    );

    match render_manager
        .update_render_total_checkpoints(id, update_render_total_checkpoints.new_total_checkpoints)
        .await
    {
        Ok(_) => StatusCode::NO_CONTENT.into_response(),
        Err(e) => e.into(),
    }
}
