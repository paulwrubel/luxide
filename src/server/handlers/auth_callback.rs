use axum::{
    extract::{Query, State},
    http::StatusCode,
    response::{IntoResponse, Response},
};
use axum_extra::extract::SignedCookieJar;
use oauth2::TokenResponse;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::server::LuxideState;

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct AuthGithubCallbackQueryParameters {
    pub code: String,
    pub state: String,
}

pub async fn auth_github_callback(
    State(state): State<LuxideState>,
    cookie_jar: SignedCookieJar,
    Query(query_parameters): Query<AuthGithubCallbackQueryParameters>,
) -> Response {
    println!("Handing request for auth_github_callback...");

    // get info from request
    let request_auth_state = query_parameters.state;
    let code = query_parameters.code;

    let session_id = match cookie_jar.get("session_id") {
        Some(cookie) => cookie.value().to_string(),
        None => {
            eprintln!("Missing session_id cookie");
            return (StatusCode::BAD_REQUEST, "Missing session_id cookie").into_response();
        }
    };

    let parsed_session_id = match Uuid::parse_str(&session_id) {
        Ok(uuid) => uuid,
        Err(e) => {
            eprintln!("Failed to parse session_id: {}", e);
            return (StatusCode::BAD_REQUEST, "Failed to parse session_id").into_response();
        }
    };

    // verify auth state - given state should match the stored state
    let stored_auth_state = state
        .auth_manager
        .get_state_for_session_id(parsed_session_id);

    if stored_auth_state.is_none() || stored_auth_state.unwrap().secret() != &request_auth_state {
        return (
            StatusCode::BAD_REQUEST,
            "No auth state or mismatched auth state found",
        )
            .into_response();
    }

    // remove state from memory since we've just validated it
    state
        .auth_manager
        .remove_state_for_session_id(parsed_session_id);

    // exchange code for access token
    let token = match state.auth_manager.exchange_code(code).await {
        Ok(token) => token,
        Err(e) => {
            eprintln!("Failed to exchange code for access token: {}", e);
            return (
                StatusCode::BAD_REQUEST,
                "Failed to exchange code for access token",
            )
                .into_response();
        }
    };

    // get user info from GitHub
    let user_info = match state.auth_manager.get_github_user_info(token).await {
        Ok(user_info) => user_info,
        Err(e) => {
            eprintln!("Failed to get user info: {}", e);
            return (StatusCode::BAD_REQUEST, "Failed to get user info").into_response();
        }
    };

    // TODO: persist user info to database

    (StatusCode::OK).into_response()
}
