use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::{IntoResponse, Response},
};

use crate::{
    server::{RequestedUserID, Claims, LuxideState, resolve_effective_user_id},
    tracing::RenderID,
};

pub async fn resume_render(
    State(state): State<LuxideState>,
    claims: Claims,
    Path(id): Path<RenderID>,
    Query(requested_user_id): Query<RequestedUserID>,
) -> Response {
    println!("Handing request for resume_render (id: {})...", id);

    let effective_user_id =
        match resolve_effective_user_id(&state.auth_manager, &claims, requested_user_id.user_id).await {
            Ok(id) => id,
            Err((status, message)) => return (status, message).into_response(),
        };

    match state
        .render_manager
        .resume_render(id, effective_user_id)
        .await
    {
        Ok(_) => StatusCode::NO_CONTENT.into_response(),
        Err(e) => e.into(),
    }
}
