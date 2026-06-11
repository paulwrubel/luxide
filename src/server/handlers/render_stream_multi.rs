use axum::extract::Query;
use axum::extract::State;
use axum::http::StatusCode;
use axum::response::sse::Event;
use axum::response::{IntoResponse, Response};
use std::collections::HashSet;
use std::convert::Infallible;

use tokio::sync::{mpsc, watch};

use crate::server::render_state_streams::{
    RenderStateSnapshot, StreamIntervalQueryParams, parse_interval, removed_event, sse_response,
    update_event,
};
use crate::server::resolve_effective_user_id;
use crate::server::{Claims, LuxideState};
use crate::tracing::RenderID;

const DEFAULT_INTERVAL_MS: u64 = 100;

pub async fn render_state_stream_multiplexed(
    State(state): State<LuxideState>,
    claims: Claims,
    Query(params): Query<StreamIntervalQueryParams>,
) -> Response {
    let effective_user_id =
        match resolve_effective_user_id(&state.auth_manager, &claims, params.user_id).await {
            Ok(id) => id,
            Err((status, message)) => return (status, message).into_response(),
        };
    let user_id = effective_user_id;
    let manager = state.render_manager.clone();
    let registry = manager.render_state_streams().clone();

    let (tx, rx) = mpsc::unbounded_channel::<Result<Event, Infallible>>();
    let (cancel_tx, mut cancel_rx) = watch::channel(());

    let interval = match parse_interval(params.interval_ms, DEFAULT_INTERVAL_MS) {
        Ok(i) => i,
        Err(message) => return (StatusCode::BAD_REQUEST, message).into_response(),
    };

    tokio::spawn(async move {
        let mut receivers: Vec<(RenderID, watch::Receiver<RenderStateSnapshot>)> = Vec::new();

        // initial subscription to all renders belonging to this user
        if let Ok(renders) = manager.get_all_renders(user_id).await {
            for render in &renders {
                let stream_rx = registry
                    .get_or_create(
                        render.id,
                        RenderStateSnapshot::new(render.id, render.state, chrono::Utc::now()),
                    )
                    .subscribe();
                receivers.push((render.id, stream_rx));
            }
        }

        let mut interval = tokio::time::interval(interval);
        let mut tick_count: u64 = 0;

        loop {
            tokio::select! {
                _ = interval.tick() => {
                    tick_count += 1;

                    // push state-change deltas for each tracked render
                    for (_render_id, rx) in &mut receivers {
                        if let Ok(true) = rx.has_changed() {
                            let snapshot = rx.borrow_and_update();
                            let event = update_event(&snapshot);
                            if tx.send(Ok(event)).is_err() {
                                // client disconnected
                                return;
                            }
                        }
                    }

                    // every ~1 second re-query for new / deleted renders
                    if tick_count.is_multiple_of(10) && let Ok(renders) = manager.get_all_renders(user_id).await {
                        let current_ids: HashSet<RenderID> =
                            renders.iter().map(|r| r.id).collect();
                        let tracked_ids: HashSet<RenderID> =
                            receivers.iter().map(|(id, _)| *id).collect();

                        // subscribe to any new renders
                        for render in &renders {
                            if !tracked_ids.contains(&render.id) {
                                let stream_rx =
                                    registry.get_or_create(render.id, RenderStateSnapshot::new(render.id, render.state, chrono::Utc::now())).subscribe();
                                receivers.push((render.id, stream_rx));
                            }
                        }

                        // emit removal events for renders that no longer exist
                        let deleted_ids: Vec<RenderID> =
                            tracked_ids.difference(&current_ids).copied().collect();
                        receivers.retain(|(id, _)| !deleted_ids.contains(id));
                        for id in deleted_ids {
                            let event = removed_event(id);
                            if tx.send(Ok(event)).is_err() {
                                return;
                            }
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
