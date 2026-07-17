use std::{path::PathBuf, sync::Arc};

use axum_extra::extract::cookie::Key;
use base64::Engine as _;
use clap::{Parser, ValueEnum};
use luxide::{
    config::{
        RenderStorageConfig, RenderStorageSecrets, ResourceStorageConfig, ResourceStorageSecrets,
        UserStorageConfig, UserStorageSecrets, load_api_config, load_api_secrets,
    },
    server::{self, AuthManager, LuxideState, build_router},
    tracing::{
        FileStorage, InMemoryStorage, PostgresStorage, RenderManager, RenderStorage,
        ResourceManager, ResourceStorage, UserStorage,
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

    // create storage backend
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
                PostgresStorage::new(host, username, password, db)
                    .await
                    .map_err(|e| format!("Failed to create render storage: {}", e))?,
            ),
            _ => return Err("Invalid render storage configuration".to_string()),
        };

    let user_storage: Arc<dyn UserStorage> = match (&config.user_storage, &secrets.user_storage) {
        (
            UserStorageConfig::Postgres { host, username, db },
            Some(UserStorageSecrets::Postgres { password }),
        ) => Arc::new(
            PostgresStorage::new(host, username, password, db)
                .await
                .map_err(|e| format!("Failed to create user storage: {}", e))?,
        ),
        _ => return Err("Invalid user storage configuration".to_string()),
    };

    let resource_storage: Arc<dyn ResourceStorage> =
        match (&config.resource_storage, &secrets.resource_storage) {
            (
                ResourceStorageConfig::Postgres { host, username, db },
                Some(ResourceStorageSecrets::Postgres { password }),
            ) => Arc::new(
                PostgresStorage::new(host, username, password, db)
                    .await
                    .map_err(|e| format!("Failed to create resource storage: {}", e))?,
            ),
            _ => {
                return Err("Invalid resource storage configuration".to_string());
            }
        };

    // create resource manager (must be constructed before render manager)
    let resource_manager = Arc::new(ResourceManager::new(Arc::clone(&resource_storage)));

    // create render manager
    let render_manager = Arc::new(
        RenderManager::new(Arc::clone(&render_storage), Arc::clone(&resource_manager))
            .await
            .map_err(|e| format!("Failed to initialize render manager: {}", e))?,
    );

    // create auth manager
    let auth_manager = Arc::new(AuthManager::new_github(
        Arc::clone(&user_storage),
        &config,
        &secrets.auth,
    ));

    // build the cookie signing key from secrets so signed cookies survive restarts
    let cookie_key_bytes = base64::engine::general_purpose::STANDARD
        .decode(&secrets.auth.cookie_jar_signing_key)
        .map_err(|e| format!("Failed to base64-decode auth.cookie_jar_signing_key: {}", e))?;
    let cookie_jar_key = Key::try_from(cookie_key_bytes.as_slice()).map_err(|e| {
        format!(
            "Invalid auth.cookie_jar_signing_key (need at least 64 decoded bytes): {}",
            e
        )
    })?;

    let router = build_router(&config).with_state(LuxideState::new(
        Arc::clone(&render_manager),
        Arc::clone(&auth_manager),
        Arc::clone(&resource_manager),
        cookie_jar_key,
    ));

    let (_, serve_result) = tokio::join!(
        render_manager.start(),
        server::serve(router, &config.address, config.port)
    );

    serve_result
}
