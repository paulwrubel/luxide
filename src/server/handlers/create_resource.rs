use axum::{
    extract::{Multipart, Query, State},
    http::StatusCode,
    response::{IntoResponse, Response},
};

use crate::{
    server::{Claims, LuxideState, RequestedUserID, resolve_effective_user_id},
    tracing::ResourceType,
};

pub async fn create_resource(
    State(state): State<LuxideState>,
    claims: Claims,
    Query(requested_user_id): Query<RequestedUserID>,
    mut multipart: Multipart,
) -> Response {
    println!("Handling request for create_resource...");

    let effective_user_id =
        match resolve_effective_user_id(&state.auth_manager, &claims, requested_user_id.user_id)
            .await
        {
            Ok(id) => id,
            Err((status, message)) => return (status, message).into_response(),
        };

    let user = match state.auth_manager.get_user(effective_user_id).await {
        Ok(Some(user)) => user,
        Ok(None) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                "User not found".to_string(),
            )
                .into_response();
        }
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to get user: {}", e),
            )
                .into_response();
        }
    };

    let mut name = None;
    let mut resource_type = None;
    let mut mime_type = None;
    let mut file_data = None;
    let mut file_content_type = None;

    while let Ok(Some(field)) = multipart.next_field().await {
        let field_name = field.name().unwrap_or("").to_string();
        match field_name.as_str() {
            "name" => {
                name = Some(field.text().await.unwrap_or_default());
            }
            "resource_type" => {
                resource_type = Some(field.text().await.unwrap_or_default());
            }
            "mime_type" => {
                mime_type = Some(field.text().await.unwrap_or_default());
            }
            "file" => {
                file_content_type = field.content_type().map(|ct| ct.to_string());
                file_data = Some(field.bytes().await.unwrap_or_default().to_vec());
            }
            _ => {}
        }
    }

    let name = match name {
        Some(n) if !n.is_empty() => n,
        _ => {
            return (StatusCode::BAD_REQUEST, "Missing or empty 'name' field").into_response();
        }
    };

    let resource_type: ResourceType = match resource_type {
        Some(rt) if !rt.is_empty() => match rt.as_str() {
            "texture_image" => ResourceType::TextureImage,
            _ => {
                return (
                    StatusCode::BAD_REQUEST,
                    format!("Unknown resource type: {}", rt),
                )
                    .into_response();
            }
        },
        _ => {
            return (
                StatusCode::BAD_REQUEST,
                "Missing or empty 'resource_type' field",
            )
                .into_response();
        }
    };

    let mime_type = mime_type
        .filter(|mt| !mt.is_empty())
        .or(file_content_type)
        .unwrap_or_else(|| "application/octet-stream".to_string());

    let data = match file_data {
        Some(d) if !d.is_empty() => d,
        _ => {
            return (StatusCode::BAD_REQUEST, "Missing or empty 'file' field").into_response();
        }
    };

    match state
        .resource_manager
        .create_resource(name, resource_type, mime_type, data, user)
        .await
    {
        Ok(resource) => (StatusCode::CREATED, axum::Json(resource)).into_response(),
        Err(e) => e.into(),
    }
}
