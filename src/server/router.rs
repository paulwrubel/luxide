use std::net::{Ipv4Addr, SocketAddr};

use axum::{
    routing::{get, post},
    Router,
};

use super::{handlers, RenderManager};

pub fn build_router() -> Router<RenderManager> {
    Router::new()
        .route("/", get(handlers::index))
        .route("/renders", post(handlers::create_render))
        .route("/renders/info", get(handlers::get_all_render_info))
        .route("/renders/{id}/info", get(handlers::get_render_info))
        .route("/renders/{id}/image", get(handlers::get_render_image))
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
