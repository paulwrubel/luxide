use axum::{
    Json,
    extract::State,
    http::StatusCode,
    response::{IntoResponse, Response},
};
use axum_extra::extract::SignedCookieJar;
use serde::Serialize;

use crate::server::{AuthManager, LuxideState};

#[derive(Serialize)]
struct LogoutResponse {
    message: String,
}

pub async fn auth_logout(
    State(state): State<LuxideState>,
    cookie_jar: SignedCookieJar,
) -> Response {
    // if a refresh token cookie exists, revoke it — idempotent if missing
    if let Some(cookie) = cookie_jar.get("refresh_token") {
        let token_hash = AuthManager::hash_refresh_token(cookie.value());
        if let Err(e) = state.auth_manager.revoke_refresh_token(&token_hash).await {
            eprintln!("Failed to revoke refresh token on logout: {}", e);
        }
    }

    (StatusCode::OK, Json(LogoutResponse {
        message: "logged out".to_string(),
    }))
        .into_response()
}
