mod admin_update_user_role;
pub use admin_update_user_role::*;

mod admin_update_user_quotas;
pub use admin_update_user_quotas::*;

mod admin_user;
pub use admin_user::*;

mod admin_users;
pub use admin_users::*;

mod auth_callback;
pub use auth_callback::*;

mod auth_login;
pub use auth_login::*;

mod auth_logout;
pub use auth_logout::*;

mod auth_refresh;
pub use auth_refresh::*;

mod create_render;
pub use create_render::*;

mod create_resource;
pub use create_resource::*;

mod delete_render;
pub use delete_render::*;

mod delete_resource;
pub use delete_resource::*;

mod get_all_renders;
pub use get_all_renders::*;

mod get_all_resource_metadata;
pub use get_all_resource_metadata::*;

mod get_current_user_info;
pub use get_current_user_info::*;

mod get_render_checkpoint_image;
pub use get_render_checkpoint_image::*;

mod get_render_checkpoint_storage_usage;
pub use get_render_checkpoint_storage_usage::*;

mod get_render_stats;
pub use get_render_stats::*;

mod get_render;
pub use get_render::*;

mod get_resource_metadata;
pub use get_resource_metadata::*;

mod get_resource_storage_usage;
pub use get_resource_storage_usage::*;

mod get_resource_data;
pub use get_resource_data::*;

mod not_found;
pub use not_found::*;

mod pause_render;
pub use pause_render::*;

mod render_stream_multi;
pub use render_stream_multi::*;

mod render_stream_single;
pub use render_stream_single::*;

mod render_stats_stream;
pub use render_stats_stream::*;

mod resume_render;
pub use resume_render::*;

mod update_render_total_checkpoints;
pub use update_render_total_checkpoints::*;

mod update_render_name;
pub use update_render_name::*;

use axum::{
    Json,
    http::StatusCode,
    response::{IntoResponse, Response},
};

use crate::tracing::RenderManagerError;

use serde::Serialize;

pub async fn index() -> String {
    println!("Handing request for index...");
    String::from("Hello, world!\n")
}

#[derive(Clone, Serialize)]
pub struct RenderManagerErrorJson {
    code: u16,
    message: String,
}

impl From<RenderManagerError> for Response {
    fn from(error: RenderManagerError) -> Self {
        match error {
            RenderManagerError::ClientError(code, err) => (
                code,
                Json(RenderManagerErrorJson {
                    code: code.into(),
                    message: err,
                }),
            )
                .into_response(),
            RenderManagerError::ServerError(err) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(RenderManagerErrorJson {
                    code: StatusCode::INTERNAL_SERVER_ERROR.into(),
                    message: err,
                }),
            )
                .into_response(),
        }
    }
}
