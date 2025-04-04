use axum::{
    Json,
    extract::State,
    http::StatusCode,
    response::{IntoResponse, Response},
};

use crate::deserialization::RenderConfig;

use super::LuxideState;

pub async fn create_render(
    State(render_manager): LuxideState,
    Json(render_config): Json<RenderConfig>,
) -> Response {
    println!("Handing request for create_render...");

    match render_manager.create_render(render_config).await {
        Ok(render) => (StatusCode::CREATED, Json(render)).into_response(),
        Err(e) => e.into(),
    }
}
