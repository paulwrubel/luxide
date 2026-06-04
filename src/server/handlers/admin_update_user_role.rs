use axum::{
    Json,
    extract::{Path, State},
    http::StatusCode,
    response::{IntoResponse, Response},
};
use serde::Deserialize;

use crate::{
    server::{AdminUser, LuxideState},
    tracing::{Role, User, UserID},
};

#[derive(Deserialize)]
pub struct UpdateUserRoleRequest {
    role: Role,
}

pub async fn update_user_role(
    State(state): State<LuxideState>,
    admin: AdminUser,
    Path(id): Path<UserID>,
    Json(body): Json<UpdateUserRoleRequest>,
) -> Response {
    println!(
        "Handling request for update_user_role (id: {}, role: {})...",
        id, body.role
    );

    // prevent self-demotion
    if admin.user.id == id {
        return (StatusCode::FORBIDDEN, "Cannot change your own admin role").into_response();
    }

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

    // update role + quotas
    target_user.role = body.role;
    match body.role {
        Role::Admin => {
            target_user.max_renders = None;
            target_user.max_checkpoints_per_render = None;
            target_user.max_render_pixel_count = None;
        }
        Role::User => {
            target_user.max_renders = Some(User::DEFAULT_MAX_RENDERS);
            target_user.max_checkpoints_per_render = Some(User::DEFAULT_MAX_CHECKPOINTS_PER_RENDER);
            target_user.max_render_pixel_count = Some(User::DEFAULT_MAX_RENDER_PIXEL_COUNT);
        }
    }

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
