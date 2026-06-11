use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::{IntoResponse, Response},
};

use crate::{server::Claims, tracing::RenderID};

use crate::server::LuxideState;

use crate::server::{RequestedUserID, resolve_effective_user_id};

pub async fn delete_render(
    State(state): State<LuxideState>,
    claims: Claims,
    Path(id): Path<RenderID>,
    Query(requested_user_id): Query<RequestedUserID>,
) -> Response {
    println!("Handing request for delete_render (id: {})...", id);

    let effective_user_id =
        match resolve_effective_user_id(&state.auth_manager, &claims, requested_user_id.user_id)
            .await
        {
            Ok(id) => id,
            Err((status, message)) => return (status, message).into_response(),
        };

    match state
        .render_manager
        .delete_render_and_checkpoints(id, effective_user_id)
        .await
    {
        Ok(()) => StatusCode::NO_CONTENT.into_response(),
        Err(e) => e.into(),
    }
}
