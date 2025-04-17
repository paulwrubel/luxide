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

    let user = match state.auth_manager.get_user(claims.sub).await {
        Ok(Some(user)) => user,
        Ok(None) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                "User not found in database".to_string(),
            )
                .into_response();
        }
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to get user: {e}"),
            )
                .into_response();
        }
    };

    match state
        .render_manager
        .create_render(render_config, user)
        .await
    {
        Ok(render) => (StatusCode::CREATED, Json(render)).into_response(),
        Err(e) => e.into(),
    }
}
