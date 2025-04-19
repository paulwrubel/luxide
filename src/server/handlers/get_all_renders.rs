use axum::{
    Json,
    extract::{Query, State},
    response::{IntoResponse, Response},
};

use crate::server::{Claims, FormattedRender, RenderFormatQueryParameters};

use crate::server::LuxideState;

pub async fn get_all_renders(
    State(state): State<LuxideState>,
    claims: Claims,
    Query(query_parameters): Query<RenderFormatQueryParameters>,
) -> Response {
    println!("Handing request for get_all_renders...");

    match state.render_manager.get_all_renders(claims.sub).await {
        Ok(renders) => Json(
            renders
                .into_iter()
                .map(|r| FormattedRender::from((query_parameters.format.unwrap_or_default(), r)))
                .collect::<Vec<_>>(),
        )
        .into_response(),
        Err(e) => e.into(),
    }
}
