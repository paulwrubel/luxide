use std::{num::NonZero, path::PathBuf, sync::Arc};

use clap::{Parser, ValueEnum};
use luxide::{
    config::{StorageConfig, load_api_config},
    server::{self, build_router},
    tracing::{
        FileStorage, InMemoryStorage, PostgresStorage, RenderManager, RenderStorage, Threads,
    },
};

#[derive(Debug, Clone, Copy, ValueEnum)]
enum StorageBackend {
    File,
    InMemory,
    Postgres,
}

#[derive(Parser, Debug)]
#[command(version, about, long_about = None)]
struct Args {
    #[arg(short, long)]
    config_file: Option<String>,
}

#[tokio::main]
async fn main() -> Result<(), String> {
    let args = Args::parse();

    let config = load_api_config(args.config_file.as_deref())
        .map_err(|e| format!("Failed to load config: {}", e))?;

    println!(
        "Starting API server at {}:{} with backend: {:?}",
        config.address, config.port, config.storage
    );

    // Create storage backend
    let storage: Arc<dyn RenderStorage> = match config.storage {
        StorageConfig::File { output_dir } => {
            Arc::new(FileStorage::new(PathBuf::from(output_dir))?)
        }
        StorageConfig::InMemory => Arc::new(InMemoryStorage::new()),
        StorageConfig::Postgres {
            host,
            username,
            password,
            db,
        } => Arc::new(
            PostgresStorage::new(&host, &username, &password, &db)
                .await
                .map_err(|e| format!("Failed to connect to postgres: {}", e))?,
        ),
    };

    // Create render manager
    let render_manager = Arc::new(
        RenderManager::new(
            Arc::clone(&storage),
            Threads::AllWithDefault(NonZero::new(24).unwrap()),
        )
        .await
        .map_err(|e| format!("Failed to initialize render manager: {}", e))?,
    );

    let router = build_router().with_state(Arc::clone(&render_manager));

    rayon::spawn(move || render_manager.start());

    server::serve(router, &config.address, config.port).await
}
