use axum::{
    Json,
    extract::{Query, State},
    http::StatusCode,
    response::{IntoResponse, Response},
};
use axum_extra::{TypedHeader, extract::SignedCookieJar, headers::ContentType};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{
    server::{GitHubUserInfo, LuxideState},
    tracing::{GithubID, User},
};

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct AuthGithubCallbackQueryParameters {
    pub code: String,
    pub state: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct AuthLoginResponse {
    pub token: String,
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

    let user = match get_user_by_github_id(&state, &user_info, user_info.id).await {
        Ok(user) => user,
        Err(e) => {
            eprintln!("Failed to get user by github id: {}", e);
            return (StatusCode::BAD_REQUEST, e).into_response();
        }
    };

    let token = match state.auth_manager.generate_new_jwt(user.id).await {
        Ok(token) => token,
        Err(e) => {
            eprintln!("Failed to generate new JWT: {}", e);
            return (StatusCode::BAD_REQUEST, "Failed to generate new JWT").into_response();
        }
    };

    println!("Generated JWT: {}", token);

    println!("User: {:#?}", user);

    (
        StatusCode::OK,
        TypedHeader(ContentType::json()),
        Json(AuthLoginResponse { token }),
    )
        .into_response()
}

async fn get_user_by_github_id(
    state: &LuxideState,
    user_info: &GitHubUserInfo,
    github_id: GithubID,
) -> Result<User, String> {
    match state.auth_manager.user_exists_by_github_id(github_id).await {
        Ok(true) => match state.auth_manager.get_user_by_github_id(github_id).await {
            Ok(Some(user)) => Ok(user),
            Ok(None) => {
                eprintln!(
                    "Failed to get user with github id {}: User exists but not found in database",
                    github_id
                );
                return Err("Failed to get user with github id".to_string());
            }
            Err(e) => {
                eprintln!(
                    "Failed to get user with github id {}: Error retrieving user from database: {}",
                    github_id, e
                );
                return Err("Failed to get user with github id".to_string());
            }
        },
        Ok(false) => {
            let user = if state.auth_manager.github_id_is_admin(github_id) {
                User::new_admin(
                    state
                        .auth_manager
                        .get_next_user_id()
                        .await
                        .expect("Failed to get next user ID"),
                    github_id,
                    user_info.login.clone(),
                    user_info.avatar_url.clone(),
                )
            } else {
                User::new(
                    state
                        .auth_manager
                        .get_next_user_id()
                        .await
                        .expect("Failed to get next user ID"),
                    github_id,
                    user_info.login.clone(),
                    user_info.avatar_url.clone(),
                )
            };

            match state.auth_manager.create_user(user).await {
                Ok(user) => Ok(user),
                Err(e) => {
                    eprintln!(
                        "Failed to create user with github id {}: Error creating user in database: {}",
                        github_id, e
                    );
                    return Err("Failed to create user with github id".to_string());
                }
            }
        }
        Err(e) => {
            eprintln!(
                "Failed to check if user with github id {} exists: Error checking user in database: {}",
                github_id, e
            );
            return Err("Failed to check if user with github id exists".to_string());
        }
    }
}
