use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::{IntoResponse, Response},
};

use crate::{server::Claims, tracing::RenderID};

use crate::server::LuxideState;

pub async fn delete_render(
    State(state): State<LuxideState>,
    claims: Claims,
    Path(id): Path<RenderID>,
) -> Response {
    println!("Handing request for delete_render (id: {})...", id);

    match state
        .render_manager
        .delete_render_and_checkpoints(id, claims.sub)
        .await
    {
        Ok(()) => StatusCode::NO_CONTENT.into_response(),
        Err(e) => e.into(),
    }
}
