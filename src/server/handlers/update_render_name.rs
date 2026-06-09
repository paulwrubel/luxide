use axum::{
    Json,
    extract::{Path, State},
    http::StatusCode,
    response::{IntoResponse, Response},
};

use crate::{
    server::{Claims, LuxideState},
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
    Json(update_render_name): Json<UpdateRenderName>,
) -> Response {
    println!("Handling request for update_render_name (id: {})...", id);

    match state
        .render_manager
        .update_render_name(id, update_render_name.name, claims.sub)
        .await
    {
        Ok(_) => StatusCode::NO_CONTENT.into_response(),
        Err(e) => e.into(),
    }
}
