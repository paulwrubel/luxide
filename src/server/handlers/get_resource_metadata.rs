use axum::{
    Json,
    extract::{Path, Query, State},
    http::StatusCode,
    response::{IntoResponse, Response},
};

use crate::{
    server::{Claims, LuxideState, RequestedUserID, resolve_effective_user_id},
    tracing::ResourceID,
};

pub async fn get_resource_metadata(
    State(state): State<LuxideState>,
    claims: Claims,
    Path(id): Path<ResourceID>,
    Query(requested_user_id): Query<RequestedUserID>,
) -> Response {
    println!("Handling request for get_resource_metadata (id: {})...", id);

    let effective_user_id =
        match resolve_effective_user_id(&state.auth_manager, &claims, requested_user_id.user_id)
            .await
        {
            Ok(id) => id,
            Err((status, message)) => return (status, message).into_response(),
        };

    match state
        .resource_manager
        .get_resource_metadata(id, effective_user_id)
        .await
    {
        Ok(Some(meta)) => (StatusCode::OK, Json(meta)).into_response(),
        Ok(None) => (StatusCode::NOT_FOUND, format!("Resource {} not found", id)).into_response(),
        Err(e) => e.into(),
    }
}
