use clap::Parser;
use luxide::server::{self, build_router, RenderManager};

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

    let render_manager = RenderManager::new();

    let router = build_router().with_state(render_manager.clone());

    rayon::spawn(move || render_manager.start());

    server::serve(router, &args.address, args.port).await
}
