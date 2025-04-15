use std::{path::PathBuf, sync::Arc};

use clap::{Parser, ValueEnum};
use luxide::{
    config::{
        RenderStorageConfig, RenderStorageSecrets, UserStorageConfig, UserStorageSecrets,
        load_api_config, load_api_secrets,
    },
    server::{self, AuthManager, LuxideState, build_router},
    tracing::{
        FileStorage, InMemoryStorage, PostgresStorage, RenderManager, RenderStorage, UserStorage,
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
        "Starting API server at {}:{} with render backend: {:?} and user backend: {:?}",
        config.address, config.port, config.render_storage, config.user_storage
    );

    // Create storage backend
    let render_storage: Arc<dyn RenderStorage> =
        match (&config.render_storage, &secrets.render_storage) {
            (RenderStorageConfig::File { output_dir }, _) => {
                Arc::new(FileStorage::new(PathBuf::from(output_dir)).map_err(|e| e.to_string())?)
            }
            (RenderStorageConfig::InMemory, _) => Arc::new(InMemoryStorage::new()),
            (
                RenderStorageConfig::Postgres { host, username, db },
                Some(RenderStorageSecrets::Postgres { password }),
            ) => Arc::new(
                PostgresStorage::new(&host, &username, &password, &db)
                    .await
                    .map_err(|e| format!("Failed to connect to postgres: {}", e))?,
            ),
            _ => return Err("Invalid storage configuration".to_string()),
        };

    let user_storage: Arc<dyn UserStorage> = match (&config.user_storage, &secrets.user_storage) {
        (
            UserStorageConfig::Postgres { host, username, db },
            Some(UserStorageSecrets::Postgres { password }),
        ) => Arc::new(
            PostgresStorage::new(&host, &username, &password, &db)
                .await
                .map_err(|e| format!("Failed to connect to postgres: {}", e))?,
        ),
        _ => return Err("Invalid storage configuration".to_string()),
    };

    // create render manager
    let render_manager = Arc::new(
        RenderManager::new(Arc::clone(&render_storage))
            .await
            .map_err(|e| format!("Failed to initialize render manager: {}", e))?,
    );

    // create auth manager
    let auth_manager = Arc::new(AuthManager::new_github(
        Arc::clone(&user_storage),
        &config,
        &secrets.auth,
    ));

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
