use axum::{
    Json,
    extract::State,
    http::StatusCode,
    response::{IntoResponse, Response},
};

use crate::{deserialization::RenderConfig, server::Claims};

use crate::server::LuxideState;

pub async fn create_render(
    State(state): State<LuxideState>,
    claims: Claims,
    Json(render_config): Json<RenderConfig>,
) -> Response {
    println!("Handing request for create_render...");

    // TODO: Add safeguard to prevent users from creating too many renders

    match state
        .render_manager
        .create_render(render_config, claims.sub)
        .await
    {
        Ok(render) => (StatusCode::CREATED, Json(render)).into_response(),
        Err(e) => e.into(),
    }
}
