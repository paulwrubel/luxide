use axum::{
    Json,
    extract::{Path, Query, State},
    http::StatusCode,
    response::{IntoResponse, Response},
};

use crate::{
    server::{FormattedRender, RenderFormatQueryParameters},
    tracing::RenderID,
};

use super::LuxideState;

pub async fn get_render(
    State(render_manager): LuxideState,
    Path(id): Path<RenderID>,
    Query(query_parameters): Query<RenderFormatQueryParameters>,
) -> Response {
    println!("Handing request for get_render...");

    match render_manager.get_render(id).await {
        Ok(Some(render)) => Json(FormattedRender::from((
            query_parameters.format.unwrap_or_default(),
            render,
        )))
        .into_response(),
        Ok(None) => StatusCode::NOT_FOUND.into_response(),
        Err(e) => e.into(),
    }
}
