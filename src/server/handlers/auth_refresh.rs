use axum::{
    Json,
    extract::State,
    http::StatusCode,
    response::{IntoResponse, Response},
};
use serde::{Deserialize, Serialize};

use crate::server::LuxideState;

#[derive(Debug, Deserialize)]
pub struct RefreshRequest {
    pub refresh_token: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "snake_case")]
pub struct RefreshResponse {
    pub token: String,
    pub refresh_token: String,
}

pub async fn auth_refresh(
    State(state): State<LuxideState>,
    Json(request): Json<RefreshRequest>,
) -> Response {
    match state.auth_manager.rotate_refresh_token(&request.refresh_token).await {
        Ok((token, refresh_token)) => {
            (
                StatusCode::OK,
                Json(RefreshResponse { token, refresh_token }),
            )
                .into_response()
        }
        Err(e) => {
            eprintln!("Failed to refresh token: {}", e);
            (
                StatusCode::UNAUTHORIZED,
                Json(serde_json::json!({
                    "code": 401,
                    "message": "refresh token expired or revoked"
                })),
            )
                .into_response()
        }
    }
}
