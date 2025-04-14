use axum::{
    Json,
    extract::State,
    http::StatusCode,
    response::{IntoResponse, Response},
};

use crate::server::LuxideState;

use serde::Serialize;

#[derive(Copy, Clone, Serialize)]
pub struct StorageUsageResponse {
    bytes: u64,
}

pub async fn get_global_render_checkpoint_storage_usage(
    State(state): State<LuxideState>,
) -> Response {
    println!("Handing request for get_global_render_checkpoint_storage_usage...");

    match state
        .render_manager
        .get_render_checkpoint_storage_usage_bytes()
        .await
    {
        Ok(bytes) => (StatusCode::OK, Json(StorageUsageResponse { bytes })).into_response(),
        Err(e) => e.into(),
    }
}
