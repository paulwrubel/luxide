use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::{IntoResponse, Response},
};

use crate::{
    server::{Claims, LuxideState, RequestedUserID, resolve_effective_user_id},
    tracing::ResourceID,
};

pub async fn delete_resource(
    State(state): State<LuxideState>,
    claims: Claims,
    Path(id): Path<ResourceID>,
    Query(requested_user_id): Query<RequestedUserID>,
) -> Response {
    println!("Handling request for delete_resource (id: {})...", id);

    let effective_user_id =
        match resolve_effective_user_id(&state.auth_manager, &claims, requested_user_id.user_id)
            .await
        {
            Ok(id) => id,
            Err((status, message)) => return (status, message).into_response(),
        };

    match state
        .resource_manager
        .delete_resource(id, effective_user_id)
        .await
    {
        Ok(()) => StatusCode::NO_CONTENT.into_response(),
        Err(e) => e.into(),
    }
}
