use std::convert::Infallible;
use std::time::Duration;

use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::sse::Event,
    response::{IntoResponse, Response},
};

use tokio::sync::{mpsc, watch};

use crate::server::render_state_streams::{
    RenderStateSnapshot, sse_response, update_event,
};
use crate::server::{Claims, LuxideState};
use crate::tracing::RenderID;

pub async fn render_state_stream_single(
    State(state): State<LuxideState>,
    claims: Claims,
    Path(render_id): Path<RenderID>,
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

            let (tx, rx) = mpsc::unbounded_channel::<Result<Event, Infallible>>();
            let (cancel_tx, mut cancel_rx) = watch::channel(());

            tokio::spawn(async move {
                let mut interval = tokio::time::interval(Duration::from_millis(50));

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
