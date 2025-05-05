use std::net::{Ipv4Addr, SocketAddr};

use axum::{
    Router,
    routing::{delete, get, post, put},
};
use include_dir::{Dir, include_dir};

use super::{LuxideState, handlers};

static UI_BUILD_DIR: Dir<'_> = include_dir!("$CARGO_MANIFEST_DIR/ui/build");

pub fn build_router() -> Router<LuxideState> {
    Router::new()
        .nest("/api/v1", build_api_router())
        .merge(build_ui_router())
}

fn get_content_type(path: &str) -> &'static str {
    match path.split('.').last().unwrap_or("") {
        "html" => "text/html",
        "js" => "application/javascript",
        "css" => "text/css",
        "json" => "application/json",
        "png" => "image/png",
        "jpg" | "jpeg" => "image/jpeg",
        "svg" => "image/svg+xml",
        "ico" => "image/x-icon",
        _ => "text/plain",
    }
}

fn build_ui_router() -> Router<LuxideState> {
    Router::new().fallback(|req: axum::http::Request<axum::body::Body>| async move {
        let path = req.uri().path().trim_start_matches('/');
        let path = if path.is_empty() { "index.html" } else { path };

        if let Some(file) = UI_BUILD_DIR.get_file(path) {
            axum::response::Response::builder()
                .header("content-type", get_content_type(path))
                .body(axum::body::Body::from(file.contents()))
                .unwrap()
        } else {
            // If file not found, return index.html for client-side routing
            if let Some(index_file) = UI_BUILD_DIR.get_file("index.html") {
                axum::response::Response::builder()
                    .header("content-type", "text/html")
                    .body(axum::body::Body::from(index_file.contents()))
                    .unwrap()
            } else {
                axum::response::Response::builder()
                    .status(404)
                    .body(axum::body::Body::from("Not found"))
                    .unwrap()
            }
        }
    })
}

fn build_api_router() -> Router<LuxideState> {
    let api_router = Router::new().route("/", get(handlers::index)).route(
        "/usage",
        get(handlers::get_global_render_checkpoint_storage_usage),
    );

    api_router
        .nest("/renders", build_renders_router())
        .nest("/auth", build_auth_router())
        .fallback(handlers::not_found)
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
