use axum::{
    Json,
    extract::{Path, Query, State},
    http::StatusCode,
    response::{IntoResponse, Response},
};

use crate::{
    server::{Claims, LuxideState, RequestedUserID, resolve_effective_user_id},
    tracing::RenderID,
};
use serde::{Deserialize, Serialize};

#[derive(Clone, Copy, Serialize, Deserialize)]
pub struct UpdateRenderTotalCheckpoints {
    new_total_checkpoints: u32,
}

pub async fn update_render_total_checkpoints(
    State(state): State<LuxideState>,
    claims: Claims,
    Path(id): Path<RenderID>,
    Query(requested_user_id): Query<RequestedUserID>,
    Json(update_render_total_checkpoints): Json<UpdateRenderTotalCheckpoints>,
) -> Response {
    println!(
        "Handing request for update_render_total_checkpoints (id: {})...",
        id
    );

    let effective_user_id =
        match resolve_effective_user_id(&state.auth_manager, &claims, requested_user_id.user_id)
            .await
        {
            Ok(id) => id,
            Err((status, message)) => return (status, message).into_response(),
        };

    match state
        .render_manager
        .update_render_total_checkpoints(
            id,
            update_render_total_checkpoints.new_total_checkpoints,
            effective_user_id,
        )
        .await
    {
        Ok(_) => StatusCode::NO_CONTENT.into_response(),
        Err(e) => e.into(),
    }
}
