use axum::{
    Json,
    extract::State,
    http::StatusCode,
    response::{IntoResponse, Response},
};

use crate::server::{Claims, LuxideState};

pub async fn get_current_user_info(State(state): State<LuxideState>, claims: Claims) -> Response {
    println!("Handing request for get_current_user_info...");

    match state.auth_manager.get_user(claims.sub).await {
        Ok(Some(user)) => Json(user).into_response(),
        Ok(None) => StatusCode::NOT_FOUND.into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e).into_response(),
    }
}
