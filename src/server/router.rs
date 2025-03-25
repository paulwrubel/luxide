use std::net::{Ipv4Addr, SocketAddr};

use axum::{
    routing::{get, post},
    Router,
};

use super::{handlers, RenderJobManager};

pub fn build_router() -> Router<RenderJobManager> {
    Router::new()
        .route("/", get(handlers::index))
        .route("/render", post(handlers::create_render_job))
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
