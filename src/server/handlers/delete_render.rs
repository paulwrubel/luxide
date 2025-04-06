use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::{IntoResponse, Response},
};

use crate::tracing::RenderID;

use super::LuxideState;

pub async fn delete_render(
    State(render_manager): LuxideState,
    Path(id): Path<RenderID>,
) -> Response {
    println!("Handing request for delete_render (id: {})...", id);

    match render_manager.delete_render_and_checkpoints(id).await {
        Ok(()) => StatusCode::NO_CONTENT.into_response(),
        Err(e) => e.into(),
    }
}
