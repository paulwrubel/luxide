use axum::{
    Json,
    extract::State,
    http::StatusCode,
    response::{IntoResponse, Response},
};
use axum_extra::extract::{SignedCookieJar, cookie::Cookie};
use serde::Serialize;
use time::Duration;

use crate::server::LuxideState;

#[derive(Debug, Serialize)]
#[serde(rename_all = "snake_case")]
pub struct RefreshResponse {
    pub access_token: String,
}

pub async fn auth_refresh(
    State(state): State<LuxideState>,
    cookie_jar: SignedCookieJar,
) -> Response {
    let refresh_token = match cookie_jar.get("refresh_token") {
        Some(cookie) => cookie.value().to_string(),
        None => {
            eprintln!(
                "Refresh attempt with missing or unverifiable refresh_token cookie (possible cookie signing key mismatch)"
            );
            return (
                StatusCode::UNAUTHORIZED,
                Json(serde_json::json!({
                    "code": 401,
                    "message": "refresh token expired or revoked"
                })),
            )
                .into_response();
        }
    };

    match state
        .auth_manager
        .rotate_refresh_token(&refresh_token)
        .await
    {
        Ok((access_token, new_refresh_token)) => {
            let refresh_cookie = Cookie::build(("refresh_token", new_refresh_token))
                .path("/api/v1/auth")
                .http_only(true)
                .same_site(axum_extra::extract::cookie::SameSite::Lax)
                .max_age(Duration::days(30));

            (
                StatusCode::OK,
                cookie_jar.add(refresh_cookie),
                Json(RefreshResponse { access_token }),
            )
                .into_response()
        }
        Err(e) => {
            eprintln!("Refresh token rejected: {}", e);
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
