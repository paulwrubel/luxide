use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::{IntoResponse, Response},
};

use crate::{
    server::{Claims, LuxideState},
    tracing::RenderID,
};

pub async fn pause_render(
    State(state): State<LuxideState>,
    claims: Claims,
    Path(id): Path<RenderID>,
) -> Response {
    println!("Handing request for pause_render (id: {})...", id);

    match state.render_manager.pause_render(id, claims.sub).await {
        Ok(_) => StatusCode::NO_CONTENT.into_response(),
        Err(e) => e.into(),
    }
}
