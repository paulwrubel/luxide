use axum::{routing::get, Router};

use super::handlers;

pub fn build_router() -> Router {
    Router::new().route("/", get(handlers::index))
}
