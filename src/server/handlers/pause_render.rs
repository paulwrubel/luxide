use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::{IntoResponse, Response},
};

use crate::tracing::RenderID;

use super::LuxideState;

pub async fn pause_render(
    State(render_manager): LuxideState,
    Path(id): Path<RenderID>,
) -> Response {
    println!("Handing request for pause_render (id: {})...", id);

    match render_manager.pause_render(id).await {
        Ok(_) => StatusCode::NO_CONTENT.into_response(),
        Err(e) => e.into(),
    }
}
