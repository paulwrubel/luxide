use axum::{
    Json,
    extract::{Path, State},
    http::StatusCode,
    response::{IntoResponse, Response},
};

use crate::server::{AdminUser, LuxideState};
use crate::tracing::UserID;

pub async fn get_admin_user(
    State(state): State<LuxideState>,
    _admin: AdminUser,
    Path(id): Path<UserID>,
) -> Response {
    println!("Handling request for get_admin_user (id: {})...", id);

    match state.auth_manager.get_user(id).await {
        Ok(Some(user)) => Json(user).into_response(),
        Ok(None) => StatusCode::NOT_FOUND.into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e).into_response(),
    }
}
