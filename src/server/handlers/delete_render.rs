use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::{IntoResponse, Response},
};

use crate::tracing::RenderID;

use crate::server::LuxideState;

pub async fn delete_render(State(state): State<LuxideState>, Path(id): Path<RenderID>) -> Response {
    println!("Handing request for delete_render (id: {})...", id);

    match state.render_manager.delete_render_and_checkpoints(id).await {
        Ok(()) => StatusCode::NO_CONTENT.into_response(),
        Err(e) => e.into(),
    }
}
