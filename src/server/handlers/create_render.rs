use axum::{
    Json,
    extract::{Query, State},
    http::StatusCode,
    response::{IntoResponse, Response},
};

use crate::{deserialization::RenderConfig, server::Claims};

use crate::server::LuxideState;

use crate::server::{RequestedUserID, resolve_effective_user_id};

pub async fn create_render(
    State(state): State<LuxideState>,
    claims: Claims,
    Query(requested_user_id): Query<RequestedUserID>,
    Json(render_config): Json<RenderConfig>,
) -> Response {
    println!("Handing request for create_render...");

    let effective_user_id =
        match resolve_effective_user_id(&state.auth_manager, &claims, requested_user_id.user_id)
            .await
        {
            Ok(id) => id,
            Err((status, message)) => return (status, message).into_response(),
        };

    let user = match state.auth_manager.get_user(effective_user_id).await {
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
