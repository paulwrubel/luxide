use axum::{
    Json,
    extract::State,
    http::StatusCode,
    response::{IntoResponse, Response},
};

use crate::server::{AdminUser, LuxideState};

pub async fn get_admin_users(State(state): State<LuxideState>, _admin: AdminUser) -> Response {
    println!("Handling request for get_admin_users...");

    match state.auth_manager.get_all_users().await {
        Ok(users) => (StatusCode::OK, Json(users)).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to get users: {e}"),
        )
            .into_response(),
    }
}
