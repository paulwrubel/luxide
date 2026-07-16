use std::{fmt::Display, sync::Arc};

use axum::{
    Json,
    http::StatusCode,
    response::{IntoResponse, Response},
};
use chrono::Utc;
use serde::Serialize;

use crate::shading::textures::Image8Bit;

use super::{
    Resource, ResourceID, ResourceMeta, ResourceStorage, ResourceType, StorageError, User, UserID,
};

#[derive(Clone)]
pub struct ResourceManager {
    storage: Arc<dyn ResourceStorage>,
}

impl ResourceManager {
    pub fn new(storage: Arc<dyn ResourceStorage>) -> Self {
        Self { storage }
    }

    pub async fn create_resource(
        &self,
        name: String,
        resource_type: ResourceType,
        mime_type: String,
        data: Vec<u8>,
        user: User,
    ) -> Result<Resource, ResourceManagerError> {
        let id = self.storage.get_next_resource_id().await?;

        let byte_size = data.len() as u64;

        // validate that the uploaded data can actually be used as this resource type
        match resource_type {
            ResourceType::TextureImage => {
                Image8Bit::from_bytes(&data, 1.0).map_err(|e| {
                    ResourceManagerError::ClientError(
                        StatusCode::BAD_REQUEST,
                        format!("Invalid image file: {}", e),
                    )
                })?;
            }
        }

        // enforce resource storage quota
        if let Some(limit) = user.max_resource_storage_bytes {
            let current_usage = self
                .storage
                .get_total_resource_bytes_stored_for_user(user.id)
                .await?;
            if current_usage + byte_size > limit {
                return Err(ResourceManagerError::ClientError(
                    StatusCode::PAYLOAD_TOO_LARGE,
                    format!(
                        "Resource storage limit would be exceeded: {} bytes currently used, {} bytes limit, {} byte upload",
                        current_usage, limit, byte_size
                    ),
                ));
            }
        }

        let resource = Resource {
            id,
            user_id: user.id,
            name,
            resource_type,
            mime_type,
            data,
            byte_size,
            created_at: Utc::now(),
        };

        self.storage
            .create_resource(resource)
            .await
            .map_err(|e| e.into())
    }

    pub async fn get_resource(
        &self,
        id: ResourceID,
        user_id: UserID,
    ) -> Result<Option<Resource>, ResourceManagerError> {
        if !self.storage.resource_exists(id).await? {
            return Ok(None);
        }

        if !self.storage.resource_belongs_to(id, user_id).await? {
            return Err(ResourceManagerError::ClientError(
                StatusCode::FORBIDDEN,
                "Forbidden".to_string(),
            ));
        }

        self.storage.get_resource(id).await.map_err(|e| e.into())
    }

    pub async fn get_resource_metadata(
        &self,
        id: ResourceID,
        user_id: UserID,
    ) -> Result<Option<ResourceMeta>, ResourceManagerError> {
        if !self.storage.resource_exists(id).await? {
            return Ok(None);
        }

        if !self.storage.resource_belongs_to(id, user_id).await? {
            return Err(ResourceManagerError::ClientError(
                StatusCode::FORBIDDEN,
                "Forbidden".to_string(),
            ));
        }

        self.storage
            .get_resource_metadata(id)
            .await
            .map_err(|e| e.into())
    }

    pub async fn get_all_resource_metadata_for_user(
        &self,
        user_id: UserID,
    ) -> Result<Vec<ResourceMeta>, ResourceManagerError> {
        self.storage
            .get_all_resource_metadata_for_user(user_id)
            .await
            .map_err(|e| e.into())
    }

    pub async fn delete_resource(
        &self,
        id: ResourceID,
        user_id: UserID,
    ) -> Result<(), ResourceManagerError> {
        if !self.storage.resource_exists(id).await? {
            return Err(ResourceManagerError::ClientError(
                StatusCode::NOT_FOUND,
                format!("Resource {} not found", id),
            ));
        }

        if !self.storage.resource_belongs_to(id, user_id).await? {
            return Err(ResourceManagerError::ClientError(
                StatusCode::FORBIDDEN,
                "Forbidden".to_string(),
            ));
        }

        self.storage.delete_resource(id).await.map_err(|e| e.into())
    }

    pub async fn get_resource_storage_usage(
        &self,
        user_id: UserID,
    ) -> Result<u64, ResourceManagerError> {
        self.storage
            .get_total_resource_bytes_stored_for_user(user_id)
            .await
            .map_err(|e| e.into())
    }
}

pub enum ResourceManagerError {
    ClientError(StatusCode, String),
    ServerError(String),
}

impl From<StorageError> for ResourceManagerError {
    fn from(error: StorageError) -> Self {
        ResourceManagerError::from(error.0)
    }
}

impl From<String> for ResourceManagerError {
    fn from(value: String) -> Self {
        ResourceManagerError::ServerError(value)
    }
}

impl Display for ResourceManagerError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ResourceManagerError::ClientError(status, message) => {
                write!(f, "Client Error: {} | {}", status, message)
            }
            ResourceManagerError::ServerError(message) => {
                write!(f, "Server Error: 500 | {}", message)
            }
        }
    }
}

#[derive(Clone, Serialize)]
pub struct ResourceManagerErrorJson {
    code: u16,
    message: String,
}

impl From<ResourceManagerError> for Response {
    fn from(error: ResourceManagerError) -> Self {
        match error {
            ResourceManagerError::ClientError(code, err) => (
                code,
                Json(ResourceManagerErrorJson {
                    code: code.into(),
                    message: err,
                }),
            )
                .into_response(),
            ResourceManagerError::ServerError(err) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ResourceManagerErrorJson {
                    code: StatusCode::INTERNAL_SERVER_ERROR.into(),
                    message: err,
                }),
            )
                .into_response(),
        }
    }
}
