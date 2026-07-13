use axum::{
    Json,
    extract::{Query, State},
    http::StatusCode,
    response::{IntoResponse, Response},
};
use serde::Serialize;

use crate::server::{Claims, LuxideState, RequestedUserID, resolve_effective_user_id};

#[derive(Serialize)]
pub struct ResourceStorageUsageResponse {
    bytes: u64,
}

pub async fn get_resource_storage_usage(
    State(state): State<LuxideState>,
    claims: Claims,
    Query(requested_user_id): Query<RequestedUserID>,
) -> Response {
    let effective_user_id =
        match resolve_effective_user_id(&state.auth_manager, &claims, requested_user_id.user_id)
            .await
        {
            Ok(id) => id,
            Err((status, message)) => return (status, message).into_response(),
        };

    match state
        .resource_manager
        .get_resource_storage_usage(effective_user_id)
        .await
    {
        Ok(bytes) => (StatusCode::OK, Json(ResourceStorageUsageResponse { bytes })).into_response(),
        Err(e) => e.into(),
    }
}
