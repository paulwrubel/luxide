use std::sync::Arc;

use clap::Parser;
use luxide::{
    server::{self, build_router},
    tracing::{FileStorage, RenderManager},
};

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

    // let storage = Arc::new(
    //     PostgresStorage::new("localhost:5432", "luxide", "luxide", "luxide")
    //         .await
    //         .map_err(|e| format!("Failed to connect to database: {}", e))?,
    // );

    let storage = Arc::new(
        FileStorage::new("./output".into())
            .map_err(|e| format!("Failed to initialize file storage: {}", e))?,
    );

    let render_manager = RenderManager::new(Arc::clone(&storage))
        .await
        .map_err(|e| format!("Failed to initialize render manager: {}", e))?;

    let router = build_router().with_state(render_manager.clone());

    rayon::spawn(move || render_manager.start());

    server::serve(router, &args.address, args.port).await
}
