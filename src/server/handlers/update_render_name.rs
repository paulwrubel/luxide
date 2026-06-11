use axum::{
    Json,
    extract::{Path, Query, State},
    http::StatusCode,
    response::{IntoResponse, Response},
};

use crate::{
    server::{RequestedUserID, Claims, LuxideState, resolve_effective_user_id},
    tracing::RenderID,
};
use serde::{Deserialize, Serialize};

#[derive(Clone, Serialize, Deserialize)]
pub struct UpdateRenderName {
    pub name: String,
}

pub async fn update_render_name(
    State(state): State<LuxideState>,
    claims: Claims,
    Path(id): Path<RenderID>,
    Query(requested_user_id): Query<RequestedUserID>,
    Json(update_render_name): Json<UpdateRenderName>,
) -> Response {
    println!("Handling request for update_render_name (id: {})...", id);

    let effective_user_id =
        match resolve_effective_user_id(&state.auth_manager, &claims, requested_user_id.user_id).await
        {
            Ok(id) => id,
            Err((status, message)) => return (status, message).into_response(),
        };

    match state
        .render_manager
        .update_render_name(id, update_render_name.name, effective_user_id)
        .await
    {
        Ok(_) => StatusCode::NO_CONTENT.into_response(),
        Err(e) => e.into(),
    }
}
