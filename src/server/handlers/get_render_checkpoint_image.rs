use std::{io::Cursor, sync::Arc};

use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::{IntoResponse, Response},
};
use axum_extra::{
    TypedHeader,
    headers::{ContentLength, ContentType},
};
use image::ImageOutputFormat;

use crate::tracing::{RenderID, RenderManager};

use crate::server::LuxideState;

pub async fn get_earliest_render_checkpoint_image(
    State(state): State<LuxideState>,
    Path(id): Path<RenderID>,
) -> Response {
    println!(
        "Handing request for get_earliest_render_checkpoint_image (id: {})...",
        id
    );

    match state
        .render_manager
        .get_earliest_render_checkpoint_iteration(id)
        .await
    {
        Ok(Some(iteration)) => {
            get_render_checkpoint_image_response(state.render_manager, id, iteration).await
        }
        Ok(None) => StatusCode::NOT_FOUND.into_response(),
        Err(e) => e.into(),
    }
}

pub async fn get_latest_render_checkpoint_image(
    State(state): State<LuxideState>,
    Path(id): Path<RenderID>,
) -> Response {
    println!(
        "Handing request for get_latest_render_checkpoint_image (id: {})...",
        id
    );

    match state
        .render_manager
        .get_latest_render_checkpoint_iteration(id)
        .await
    {
        Ok(Some(iteration)) => {
            get_render_checkpoint_image_response(state.render_manager, id, iteration).await
        }
        Ok(None) => StatusCode::NOT_FOUND.into_response(),
        Err(e) => e.into(),
    }
}

pub async fn get_render_checkpoint_image(
    State(state): State<LuxideState>,
    Path((id, checkpoint_iteration)): Path<(RenderID, u32)>,
) -> Response {
    println!(
        "Handing request for get_render_checkpoint (id: {}, iteration: {})...",
        id, checkpoint_iteration
    );

    get_render_checkpoint_image_response(state.render_manager, id, checkpoint_iteration).await
}

async fn get_render_checkpoint_image_response(
    render_manager: Arc<RenderManager>,
    id: RenderID,
    checkpoint_iteration: u32,
) -> Response {
    match render_manager
        .get_render_checkpoint_as_image(id, checkpoint_iteration)
        .await
    {
        Ok(Some(image)) => {
            // write image to intermediate buffer
            let mut img_buffer = Vec::new();

            if let Err(err) =
                image.write_to(&mut Cursor::new(&mut img_buffer), ImageOutputFormat::Png)
            {
                println!("Failed to write image to buffer: {err}");
                return (StatusCode::INTERNAL_SERVER_ERROR, err.to_string()).into_response();
            }

            (
                StatusCode::OK,
                TypedHeader(ContentType::png()),
                TypedHeader(ContentLength(img_buffer.len() as u64)),
                img_buffer,
            )
                .into_response()
        }
        Ok(None) => StatusCode::NOT_FOUND.into_response(),
        Err(e) => e.into(),
    }
}
