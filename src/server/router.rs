use std::net::{Ipv4Addr, SocketAddr};

use axum::{
    Router,
    routing::{delete, get, post, put},
};

use super::{LuxideState, handlers};

pub fn build_router() -> Router<LuxideState> {
    // /render routes
    build_base_router()
        .nest("/renders", build_renders_router())
        .nest("/auth", build_auth_router())
}

fn build_base_router() -> Router<LuxideState> {
    Router::new().route("/", get(handlers::index)).route(
        "/usage",
        get(handlers::get_global_render_checkpoint_storage_usage),
    )
}

fn build_renders_router() -> Router<LuxideState> {
    Router::new()
        .route("/{id}", get(handlers::get_render))
        .route("/{id}/stats", get(handlers::get_render_stats))
        .route("/", get(handlers::get_all_renders))
        .route("/", post(handlers::create_render))
        .route(
            "/{id}/checkpoint/earliest",
            get(handlers::get_earliest_render_checkpoint_image),
        )
        .route(
            "/{id}/checkpoint/latest",
            get(handlers::get_latest_render_checkpoint_image),
        )
        .route(
            "/{id}/checkpoint/{checkpoint_iteration}",
            get(handlers::get_render_checkpoint_image),
        )
        .route("/{id}", delete(handlers::delete_render))
        .route("/{id}/pause", post(handlers::pause_render))
        .route("/{id}/resume", post(handlers::resume_render))
        .route(
            "/{id}/parameters/total_checkpoints",
            put(handlers::update_render_total_checkpoints),
        )
}

fn build_auth_router() -> Router<LuxideState> {
    Router::new()
        .route("/login", get(handlers::auth_login))
        .route("/github/callback", get(handlers::auth_github_callback))
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
