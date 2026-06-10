use std::convert::Infallible;

use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::sse::Event,
    response::{IntoResponse, Response},
};

use tokio::sync::{mpsc, watch};

use crate::server::render_state_streams::{
    RenderStateSnapshot, StreamIntervalQueryParams, parse_interval, sse_response, update_event,
};
use crate::server::{Claims, LuxideState};
use crate::tracing::RenderID;

const DEFAULT_INTERVAL_MS: u64 = 50;

pub async fn render_state_stream_single(
    State(state): State<LuxideState>,
    claims: Claims,
    Path(render_id): Path<RenderID>,
    Query(params): Query<StreamIntervalQueryParams>,
) -> Response {
    match state.render_manager.get_render(render_id, claims.sub).await {
        Ok(Some(render)) => {
            let registry = state.render_manager.render_state_streams().clone();
            let mut watch_rx = registry
                .get_or_create(
                    render_id,
                    RenderStateSnapshot::new(render.id, render.state, chrono::Utc::now()),
                )
                .subscribe();

            let interval = match parse_interval(params.interval_ms, DEFAULT_INTERVAL_MS) {
                Ok(i) => i,
                Err(message) => return (StatusCode::BAD_REQUEST, message).into_response(),
            };

            let (tx, rx) = mpsc::unbounded_channel::<Result<Event, Infallible>>();
            let (cancel_tx, mut cancel_rx) = watch::channel(());

            tokio::spawn(async move {
                let mut interval = tokio::time::interval(interval);

                loop {
                    tokio::select! {
                        _ = interval.tick() => {
                            if let Ok(true) = watch_rx.has_changed() {
                                let snapshot = watch_rx.borrow_and_update();
                                let event = update_event(&snapshot);
                                if tx.send(Ok(event)).is_err() {
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
