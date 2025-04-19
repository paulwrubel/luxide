use axum::{
    Json,
    extract::State,
    http::StatusCode,
    response::{IntoResponse, Response},
};

use crate::server::{Claims, LuxideState};

use serde::Serialize;

#[derive(Copy, Clone, Serialize)]
pub struct StorageUsageResponse {
    bytes: u64,
}

pub async fn get_global_render_checkpoint_storage_usage(
    State(state): State<LuxideState>,
    claims: Claims,
) -> Response {
    println!("Handing request for get_global_render_checkpoint_storage_usage...");

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
        .get_render_checkpoint_storage_usage_bytes(user)
        .await
    {
        Ok(bytes) => (StatusCode::OK, Json(StorageUsageResponse { bytes })).into_response(),
        Err(e) => e.into(),
    }
}
