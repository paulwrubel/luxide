use dashmap::DashMap;
use serde::{Deserialize, Serialize};
use std::convert::Infallible;
use std::pin::Pin;
use std::task::{Context, Poll};
use std::time::Duration;
use tokio::sync::watch;

use axum::response::Sse;
use axum::response::sse::{Event, KeepAlive};
use futures::Stream;
use tokio::sync::mpsc;
use tokio_stream::wrappers::UnboundedReceiverStream;

use crate::tracing::{RenderID, RenderState};

#[derive(Copy, Clone, Debug, PartialEq, Serialize)]
pub struct RenderStateSnapshot {
    pub render_id: RenderID,
    pub state: RenderState,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

impl RenderStateSnapshot {
    pub fn new(
        render_id: RenderID,
        state: RenderState,
        updated_at: chrono::DateTime<chrono::Utc>,
    ) -> Self {
        Self {
            render_id,
            state,
            updated_at,
        }
    }
}

pub struct RenderStreamRegistry {
    channels: DashMap<RenderID, watch::Sender<RenderStateSnapshot>>,
}

impl RenderStreamRegistry {
    pub fn new() -> Self {
        Self {
            channels: DashMap::new(),
        }
    }

    pub fn get_or_create(
        &self,
        render_id: RenderID,
        initial_state: RenderStateSnapshot,
    ) -> watch::Sender<RenderStateSnapshot> {
        self.channels
            .entry(render_id)
            .or_insert_with(|| watch::channel(initial_state).0)
            .clone()
    }

    pub fn send(&self, snapshot: RenderStateSnapshot) {
        if let Some(sender) = self.channels.get(&snapshot.render_id) {
            let _ = sender.send(snapshot);
        }
    }

    pub fn subscribe(&self, render_id: RenderID) -> Option<watch::Receiver<RenderStateSnapshot>> {
        self.channels
            .get(&render_id)
            .map(|sender| sender.subscribe())
    }

    pub fn remove(&self, render_id: RenderID) {
        self.channels.remove(&render_id);
    }
}

impl Default for RenderStreamRegistry {
    fn default() -> Self {
        Self::new()
    }
}

pub struct ShutdownStream<S> {
    inner: S,
    _cancel_tx: watch::Sender<()>,
}

impl<S> ShutdownStream<S> {
    fn new(inner: S, cancel_tx: watch::Sender<()>) -> Self {
        Self {
            inner,
            _cancel_tx: cancel_tx,
        }
    }
}

impl<S: Stream + Unpin> Stream for ShutdownStream<S> {
    type Item = S::Item;

    fn poll_next(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Option<Self::Item>> {
        Pin::new(&mut self.inner).poll_next(cx)
    }
}

pub fn update_event(snapshot: &RenderStateSnapshot) -> Event {
    Event::default()
        .event("update")
        .data(serde_json::to_string(snapshot).unwrap())
}

pub fn removed_event(render_id: RenderID) -> Event {
    Event::default()
        .event("removed")
        .data(serde_json::json!({"render_id": render_id}).to_string())
}

pub fn sse_response(
    rx: mpsc::UnboundedReceiver<Result<Event, Infallible>>,
    cancel_tx: watch::Sender<()>,
) -> Sse<impl Stream<Item = Result<Event, Infallible>>> {
    Sse::new(ShutdownStream::new(
        UnboundedReceiverStream::new(rx),
        cancel_tx,
    ))
    .keep_alive(
        KeepAlive::new()
            .interval(Duration::from_secs(15))
            .text("keepalive"),
    )
}

const MIN_INTERVAL_MS: u64 = 50;

#[derive(Deserialize)]
pub struct StreamIntervalQueryParams {
    pub interval_ms: Option<u64>,
}

pub fn parse_interval(requested: Option<u64>, default_ms: u64) -> Result<Duration, String> {
    match requested {
        Some(ms) if ms < MIN_INTERVAL_MS => Err(format!(
            "interval_ms must be at least {}ms, got {}ms",
            MIN_INTERVAL_MS, ms
        )),
        Some(ms) => Ok(Duration::from_millis(ms)),
        None => Ok(Duration::from_millis(default_ms)),
    }
}
