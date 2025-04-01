use std::{path::PathBuf, sync::Arc};

use async_trait::async_trait;
use clap::{Parser, ValueEnum};
use luxide::{
    server::{self, build_router},
    tracing::{
        FileStorage, InMemoryStorage, PostgresStorage, Render, RenderCheckpoint, RenderID,
        RenderManager, RenderState, RenderStorage, RenderStorageError,
    },
    utils::ProgressInfo,
};

#[derive(Debug, Clone, Copy, ValueEnum)]
enum StorageBackend {
    File,
    InMemory,
    Postgres,
}

#[derive(Clone)]
enum Storage {
    File(FileStorage),
    InMemory(InMemoryStorage),
    Postgres(PostgresStorage),
}

// macro_rules! delegate_storage {
//     ($self:expr, $method:ident $(, $arg:expr)*) => {
//         match $self {
//             Storage::File(s) => s.$method($($arg),*).await,
//             Storage::InMemory(s) => s.$method($($arg),*).await,
//             Storage::Postgres(s) => s.$method($($arg),*).await,
//         }
//     };
// }

// #[async_trait]
// impl RenderStorage for Storage {
//     async fn get_render(&self, id: RenderID) -> Result<Option<Render>, RenderStorageError> {
//         delegate_storage!(self, get_render, id)
//     }

//     async fn get_all_renders(&self) -> Result<Vec<Render>, RenderStorageError> {
//         delegate_storage!(self, get_all_renders)
//     }

//     async fn create_render(&self, render: Render) -> Result<Render, RenderStorageError> {
//         delegate_storage!(self, create_render, render)
//     }

//     async fn update_render_state(
//         &self,
//         id: RenderID,
//         new_state: RenderState,
//     ) -> Result<(), RenderStorageError> {
//         delegate_storage!(self, update_render_state, id, new_state)
//     }

//     async fn update_render_progress(
//         &self,
//         render_id: RenderID,
//         progress_info: ProgressInfo,
//     ) -> Result<(), RenderStorageError> {
//         delegate_storage!(self, update_render_progress, render_id, progress_info)
//     }

//     async fn create_render_checkpoint(
//         &self,
//         render_checkpoint: RenderCheckpoint,
//     ) -> Result<(), RenderStorageError> {
//         delegate_storage!(self, create_render_checkpoint, render_checkpoint)
//     }

//     async fn get_render_checkpoint(
//         &self,
//         render_id: RenderID,
//         iteration: u32,
//     ) -> Result<Option<RenderCheckpoint>, RenderStorageError> {
//         delegate_storage!(self, get_render_checkpoint, render_id, iteration)
//     }

//     async fn delete_render_and_checkpoints(&self, id: RenderID) -> Result<(), RenderStorageError> {
//         delegate_storage!(self, delete_render_and_checkpoints, id)
//     }

//     async fn get_next_id(&self) -> Result<RenderID, RenderStorageError> {
//         delegate_storage!(self, get_next_id)
//     }
// }

#[derive(Parser, Debug)]
#[command(version, about, long_about = None)]
struct Args {
    #[arg(short, long, default_value = "0.0.0.0")]
    address: String,

    #[arg(short, long, default_value_t = 8080)]
    port: u16,

    /// Storage backend to use
    #[arg(short, long, default_value = "in-memory")]
    storage: StorageBackend,

    /// Output directory for file storage (only used with --storage file)
    #[arg(short, long, default_value = "./output")]
    output_dir: String,

    /// Postgres host:port (only used with --storage postgres)
    #[arg(long, default_value = "localhost:5432")]
    postgres_host: String,

    /// Postgres database name (only used with --storage postgres)
    #[arg(long, default_value = "luxide")]
    postgres_db: String,

    /// Postgres username (only used with --storage postgres)
    #[arg(long, default_value = "luxide")]
    postgres_username: String,

    /// Postgres password (only used with --storage postgres)
    #[arg(long, default_value = "luxide")]
    postgres_password: String,
}

#[tokio::main]
async fn main() -> Result<(), String> {
    let args = Args::parse();

    println!("Starting API server at {}:{}", args.address, args.port);

    // Create storage backend
    let storage: Arc<dyn RenderStorage> = match args.storage {
        StorageBackend::File => Arc::new(FileStorage::new(PathBuf::from(args.output_dir))?),
        StorageBackend::InMemory => Arc::new(InMemoryStorage::new()),
        StorageBackend::Postgres => Arc::new(
            PostgresStorage::new(
                &args.postgres_host,
                &args.postgres_username,
                &args.postgres_password,
                &args.postgres_db,
            )
            .await
            .map_err(|e| format!("Failed to connect to postgres: {}", e))?,
        ),
    };

    // Create render manager
    let render_manager = Arc::new(
        RenderManager::new(Arc::clone(&storage))
            .await
            .map_err(|e| format!("Failed to initialize render manager: {}", e))?,
    );

    let router = build_router().with_state(Arc::clone(&render_manager));

    rayon::spawn(move || render_manager.start());

    server::serve(router, &args.address, args.port).await
}
