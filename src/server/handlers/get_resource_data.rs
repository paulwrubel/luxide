use axum::{
    extract::{Path, Query, State},
    http::{StatusCode, header},
    response::{IntoResponse, Response},
};

use crate::{
    server::{Claims, LuxideState, RequestedUserID, resolve_effective_user_id},
    tracing::ResourceID,
};

#[derive(serde::Deserialize)]
pub struct ResizeParams {
    pub max_dim: Option<u32>,
}

pub async fn get_resource_data(
    State(state): State<LuxideState>,
    claims: Claims,
    Path(id): Path<ResourceID>,
    Query(requested_user_id): Query<RequestedUserID>,
    Query(resize_params): Query<ResizeParams>,
) -> Response {
    println!("Handling request for get_resource_data (id: {})...", id);

    let effective_user_id =
        match resolve_effective_user_id(&state.auth_manager, &claims, requested_user_id.user_id)
            .await
        {
            Ok(id) => id,
            Err((status, message)) => return (status, message).into_response(),
        };

    match state
        .resource_manager
        .get_resource(id, effective_user_id)
        .await
    {
        Ok(Some(resource)) => match resize_params.max_dim {
            None => (
                StatusCode::OK,
                [(header::CONTENT_TYPE, resource.mime_type)],
                resource.data,
            )
                .into_response(),
            Some(0) => (StatusCode::BAD_REQUEST, "max_dim must be at least 1").into_response(),
            Some(n) => {
                let max_dim = n;

                // peeking at dimensions via the image header avoids decoding the full image
                let dims = image::io::Reader::new(std::io::Cursor::new(&resource.data))
                    .with_guessed_format()
                    .ok()
                    .and_then(|r| r.into_dimensions().ok());

                let dims = match dims {
                    Some(d) => d,
                    None => {
                        return (
                            StatusCode::INTERNAL_SERVER_ERROR,
                            format!("Failed to read image dimensions for resource {}", id),
                        )
                            .into_response();
                    }
                };

                // no resize needed, return original bytes as-is
                if dims.0.max(dims.1) <= max_dim {
                    return (
                        StatusCode::OK,
                        [(header::CONTENT_TYPE, resource.mime_type)],
                        resource.data,
                    )
                        .into_response();
                }

                let mime_type = resource.mime_type;
                let data = resource.data;

                // decode, resize, and re-encode are CPU-heavy — offload to
                // spawn_blocking to avoid stalling the async runtime
                match tokio::task::spawn_blocking(move || resize_image(data, mime_type, max_dim))
                    .await
                {
                    Ok(Ok((bytes, content_type))) => (
                        StatusCode::OK,
                        [(header::CONTENT_TYPE, content_type)],
                        bytes,
                    )
                        .into_response(),
                    Ok(Err(msg)) => (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        format!("Failed to resize image for resource {}: {}", id, msg),
                    )
                        .into_response(),
                    Err(_) => (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        format!("Internal error resizing image for resource {}", id),
                    )
                        .into_response(),
                }
            }
        },
        Ok(None) => (StatusCode::NOT_FOUND, format!("Resource {} not found", id)).into_response(),
        Err(e) => e.into(),
    }
}

fn resize_image(
    data: Vec<u8>,
    mime_type: String,
    max_dim: u32,
) -> Result<(Vec<u8>, String), String> {
    let img = image::load_from_memory(&data).map_err(|e| e.to_string())?;
    let resized = img.thumbnail(max_dim, max_dim);

    // try to write back in the original format; default to png if unsupported
    let format_opt = image::ImageFormat::from_mime_type(&mime_type);
    let (format, content_type) = format_opt
        .and_then(|f| {
            if f.can_write() {
                Some((f, mime_type))
            } else {
                None
            }
        })
        .unwrap_or((image::ImageFormat::Png, "image/png".to_string()));

    // jpeg encoder rejects rgba pixels — convert to rgb beforehand
    let output_image = if format == image::ImageFormat::Jpeg {
        image::DynamicImage::ImageRgb8(resized.to_rgb8())
    } else {
        resized
    };

    let mut buf = Vec::new();
    output_image
        .write_to(&mut std::io::Cursor::new(&mut buf), format)
        .map_err(|e| e.to_string())?;

    Ok((buf, content_type))
}
