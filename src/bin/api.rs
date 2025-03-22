use std::net::{Ipv4Addr, SocketAddr};

use clap::Parser;
use luxide::http::build_router;

#[derive(Parser, Debug)]
#[command(version, about, long_about = None)]
struct Args {
    #[arg(short, long, default_value = "0.0.0.0")]
    address: String,

    #[arg(short, long, default_value_t = 8080)]
    port: u16,
}

#[tokio::main]
async fn main() -> Result<(), String> {
    let args = Args::parse();

    println!("Starting API server at {}/{}", args.address, args.port);

    let app = build_router();

    let ipv4_addr = match args.address.parse::<Ipv4Addr>() {
        Ok(addr) => addr,
        Err(err) => return Err(err.to_string()),
    };

    let addr = SocketAddr::from((ipv4_addr, args.port));
    println!("Server running...");

    axum::serve(app, addr)
        .await
        .map_err(|err| err.to_string())?;

    Ok(())
}
