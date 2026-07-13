use axum::{
    Json,
    extract::{Path, State},
    http::StatusCode,
    response::{IntoResponse, Response},
};
use serde::Deserialize;

use crate::{
    server::{AdminUser, LuxideState},
    tracing::UserID,
};

#[derive(Deserialize)]
pub struct UpdateUserQuotasRequest {
    pub max_renders: Option<u32>,
    pub max_checkpoints_per_render: Option<u32>,
    pub max_render_pixel_count: Option<u32>,
    pub max_resource_storage_bytes: Option<u64>,
}

pub async fn update_user_quotas(
    State(state): State<LuxideState>,
    _admin: AdminUser,
    Path(id): Path<UserID>,
    Json(body): Json<UpdateUserQuotasRequest>,
) -> Response {
    println!("Handling request for update_user_quotas (id: {})...", id);

    // look up target user
    let mut target_user = match state.auth_manager.get_user(id).await {
        Ok(Some(user)) => user,
        Ok(None) => return StatusCode::NOT_FOUND.into_response(),
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to look up user: {e}"),
            )
                .into_response();
        }
    };

    // patch quota fields
    target_user.max_renders = body.max_renders;
    target_user.max_checkpoints_per_render = body.max_checkpoints_per_render;
    target_user.max_render_pixel_count = body.max_render_pixel_count;
    target_user.max_resource_storage_bytes = body.max_resource_storage_bytes;

    // update in DB
    match state.auth_manager.update_user(target_user).await {
        Ok(updated) => (StatusCode::OK, Json(updated)).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to update user: {e}"),
        )
            .into_response(),
    }
}
