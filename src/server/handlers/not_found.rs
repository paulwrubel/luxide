use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
};

pub async fn not_found() -> Response {
    return StatusCode::NOT_FOUND.into_response();
}
