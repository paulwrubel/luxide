use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct APIConfig {
    pub address: String,
    pub port: u16,

    pub storage: StorageConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case", tag = "type")]
pub enum StorageConfig {
    File {
        output_dir: String,
    },
    InMemory,
    Postgres {
        host: String,
        username: String,
        password: String,
        db: String,
    },
}

const DEFAULT_CONFIG_FILENAME: &str = "luxide.json";

pub fn load_api_config(filename: Option<&str>) -> Result<APIConfig, String> {
    let filename = filename.unwrap_or(DEFAULT_CONFIG_FILENAME);
    let config_path = std::env::current_dir().unwrap().join(filename);

    let config_string = std::fs::read_to_string(config_path).map_err(|e| e.to_string())?;

    serde_json::from_str(&config_string).map_err(|e| e.to_string())
}
