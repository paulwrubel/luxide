use std::{path::PathBuf, sync::Arc};

use clap::{Parser, ValueEnum};
use luxide::{
    config::{StorageConfig, StorageSecrets, load_api_config, load_api_secrets},
    server::{self, AuthManager, LuxideState, build_router},
    tracing::{FileStorage, InMemoryStorage, PostgresStorage, RenderManager, RenderStorage},
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

    #[arg(short, long)]
    secret_file: Option<String>,
}

#[tokio::main]
async fn main() -> Result<(), String> {
    let args = Args::parse();

    let config = load_api_config(args.config_file.as_deref())
        .map_err(|e| format!("Failed to load config: {}", e))?;

    let secrets = load_api_secrets(args.secret_file.as_deref())
        .map_err(|e| format!("Failed to load secrets: {}", e))?;

    println!(
        "Starting API server at {}:{} with backend: {:?}",
        config.address, config.port, config.storage
    );

    // Create storage backend
    let storage: Arc<dyn RenderStorage> = match (&config.storage, &secrets.storage) {
        (StorageConfig::File { output_dir }, _) => {
            Arc::new(FileStorage::new(PathBuf::from(output_dir)).map_err(|e| e.to_string())?)
        }
        (StorageConfig::InMemory, _) => Arc::new(InMemoryStorage::new()),
        (
            StorageConfig::Postgres { host, username, db },
            Some(StorageSecrets::Postgres { password }),
        ) => Arc::new(
            PostgresStorage::new(&host, &username, &password, &db)
                .await
                .map_err(|e| format!("Failed to connect to postgres: {}", e))?,
        ),
        _ => return Err("Invalid storage configuration".to_string()),
    };

    // create render manager
    let render_manager = Arc::new(
        RenderManager::new(Arc::clone(&storage))
            .await
            .map_err(|e| format!("Failed to initialize render manager: {}", e))?,
    );

    // create auth manager
    let auth_manager = Arc::new(AuthManager::new_github(&config, &secrets.auth));

    let router = build_router().with_state(LuxideState::new_with_generated_key(
        Arc::clone(&render_manager),
        Arc::clone(&auth_manager),
    ));

    let (_, serve_result) = tokio::join!(
        render_manager.start(),
        server::serve(router, &config.address, config.port)
    );

    serve_result
}
