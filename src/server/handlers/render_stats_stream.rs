use std::convert::Infallible;

use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::sse::Event,
    response::{IntoResponse, Response},
};

use tokio::sync::{mpsc, watch};

use crate::server::render_state_streams::{
    StreamIntervalQueryParams, parse_interval, sse_response,
};
use crate::server::resolve_effective_user_id;
use crate::server::{Claims, LuxideState};
use crate::tracing::RenderID;

const DEFAULT_INTERVAL_MS: u64 = 500;

pub async fn render_stats_stream_single(
    State(state): State<LuxideState>,
    claims: Claims,
    Path(render_id): Path<RenderID>,
    Query(params): Query<StreamIntervalQueryParams>,
) -> Response {
    // Validate ownership
    let effective_user_id =
        match resolve_effective_user_id(&state.auth_manager, &claims, params.user_id).await {
            Ok(id) => id,
            Err((status, message)) => return (status, message).into_response(),
        };
    match state
        .render_manager
        .get_render(render_id, effective_user_id)
        .await
    {
        Ok(Some(_)) => {
            let interval = match parse_interval(params.interval_ms, DEFAULT_INTERVAL_MS) {
                Ok(i) => i,
                Err(message) => return (StatusCode::BAD_REQUEST, message).into_response(),
            };

            let manager = state.render_manager.clone();
            let user_id = effective_user_id;

            let (tx, rx) = mpsc::unbounded_channel::<Result<Event, Infallible>>();
            let (cancel_tx, mut cancel_rx) = watch::channel(());

            tokio::spawn(async move {
                let mut interval_timer = tokio::time::interval(interval);

                loop {
                    tokio::select! {
                        _ = interval_timer.tick() => {
                            // Re-query stats from storage each tick
                            match manager.get_render_stats(render_id, user_id).await {
                                Ok(Some(stats)) => {
                                    let event = Event::default()
                                        .event("update")
                                        .data(serde_json::to_string(&stats).unwrap());
                                    if tx.send(Ok(event)).is_err() {
                                        return;
                                    }
                                }
                                Ok(None) => {
                                    // Render no longer exists — stop streaming
                                    return;
                                }
                                Err(_) => {
                                    // Storage error — stop streaming
                                    return;
                                }
                            }
                        }
                        _ = cancel_rx.changed() => {
                            break;
                        }
                    }
                }
            });

            sse_response(rx, cancel_tx).into_response()
        }
        Ok(None) => StatusCode::NOT_FOUND.into_response(),
        Err(e) => e.into(),
    }
}
