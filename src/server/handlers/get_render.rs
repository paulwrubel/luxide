use axum::{
    Json,
    extract::{Path, Query, State},
    http::StatusCode,
    response::{IntoResponse, Response},
};

use crate::{
    server::{Claims, FormattedRender, RenderFormatQueryParameters},
    tracing::RenderID,
};

use crate::server::resolve_effective_user_id;

use crate::server::LuxideState;

pub async fn get_render(
    State(state): State<LuxideState>,
    claims: Claims,
    Path(id): Path<RenderID>,
    Query(query_parameters): Query<RenderFormatQueryParameters>,
) -> Response {
    println!("Handing request for get_render (id: {})...", id);

    let effective_user_id =
        match resolve_effective_user_id(&state.auth_manager, &claims, query_parameters.user_id)
            .await
        {
            Ok(id) => id,
            Err((status, message)) => return (status, message).into_response(),
        };

    match state.render_manager.get_render(id, effective_user_id).await {
        Ok(Some(render)) => Json(FormattedRender::from((
            query_parameters.format.unwrap_or_default(),
            render,
        )))
        .into_response(),
        Ok(None) => StatusCode::NOT_FOUND.into_response(),
        Err(e) => e.into(),
    }
}
