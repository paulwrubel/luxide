use axum::{
    Json,
    extract::{Query, State},
    http::StatusCode,
    response::{IntoResponse, Response},
};

use crate::server::{Claims, LuxideState, RequestedUserID, resolve_effective_user_id};

pub async fn get_all_resource_metadata(
    State(state): State<LuxideState>,
    claims: Claims,
    Query(requested_user_id): Query<RequestedUserID>,
) -> Response {
    println!("Handling request for get_all_resource_metadata...");

    let effective_user_id =
        match resolve_effective_user_id(&state.auth_manager, &claims, requested_user_id.user_id)
            .await
        {
            Ok(id) => id,
            Err((status, message)) => return (status, message).into_response(),
        };

    match state
        .resource_manager
        .get_all_resource_metadata_for_user(effective_user_id)
        .await
    {
        Ok(resources) => (StatusCode::OK, Json(resources)).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to get resources: {}", e),
        )
            .into_response(),
    }
}
