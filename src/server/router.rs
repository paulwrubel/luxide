use std::{
    net::{Ipv4Addr, SocketAddr},
    sync::Arc,
};

use axum::{
    Router,
    routing::{delete, get, post},
};

use crate::tracing::{RenderManager, RenderStorage};

use super::handlers;

pub fn build_router() -> Router<Arc<RenderManager>> {
    Router::new()
        .route("/", get(handlers::index))
        .route("/renders/{id}", get(handlers::get_render))
        .route("/renders", get(handlers::get_all_renders))
        .route("/renders", post(handlers::create_render))
        .route(
            "/renders/{id}/checkpoint/{checkpoint_iteration}",
            get(handlers::get_render_checkpoint_image),
        )
        .route("/renders/{id}", delete(handlers::delete_render))
        .route("/renders/{id}/pause", post(handlers::pause_render))
}

pub async fn serve(router: Router, address: &str, port: u16) -> Result<(), String> {
    // validate the IP address
    let ip = address.parse::<Ipv4Addr>().map_err(|err| err.to_string())?;

    let addr = SocketAddr::new(ip.into(), port);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();

    println!("Running server...");
    axum::serve(listener, router)
        .await
        .map_err(|err| err.to_string())
}
