use serde::{Deserialize, Serialize};

use crate::tracing::GithubID;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct APIConfig {
    pub address: String,
    pub port: u16,
    pub public_url: Option<String>,

    pub render_storage: RenderStorageConfig,
    pub user_storage: UserStorageConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case", tag = "type")]
pub enum RenderStorageConfig {
    File {
        output_dir: String,
    },
    InMemory,
    Postgres {
        host: String,
        username: String,
        db: String,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case", tag = "type")]
pub enum UserStorageConfig {
    Postgres {
        host: String,
        username: String,
        db: String,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct APISecrets {
    pub auth: AuthSecrets,
    pub render_storage: Option<RenderStorageSecrets>,
    pub user_storage: Option<UserStorageSecrets>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct AuthSecrets {
    pub github: GitHubSecrets,
    pub jwt: JWTSecrets,
    pub admin_github_ids: Vec<GithubID>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct GitHubSecrets {
    pub client_id: String,
    pub client_secret: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct JWTSecrets {
    pub private_key_pem_filename: String,
    pub public_key_pem_filename: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case", tag = "type")]
pub enum RenderStorageSecrets {
    Postgres { password: String },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case", tag = "type")]
pub enum UserStorageSecrets {
    Postgres { password: String },
}

const DEFAULT_CONFIG_FILENAME: &str = "luxide.json";
const DEFAULT_SECRETS_FILENAME: &str = "luxide.secret.json";

pub fn load_api_config(filename: Option<&str>) -> Result<APIConfig, String> {
    let filename = filename.unwrap_or(DEFAULT_CONFIG_FILENAME);

    load_api_json_file(filename)
}

pub fn load_api_secrets(filename: Option<&str>) -> Result<APISecrets, String> {
    let filename = filename.unwrap_or(DEFAULT_SECRETS_FILENAME);

    load_api_json_file(filename)
}

fn load_api_json_file<T>(filename: &str) -> Result<T, String>
where
    T: for<'de> Deserialize<'de>,
{
    let path = std::env::current_dir().unwrap().join(filename);

    let contents = std::fs::read_to_string(path).map_err(|e| e.to_string())?;

    serde_json::from_str(&contents).map_err(|e| e.to_string())
}
