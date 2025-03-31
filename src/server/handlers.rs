use std::io::Cursor;

use axum::{
    Json,
    extract::{Path, State},
    http::StatusCode,
    response::{IntoResponse, Response},
};
use axum_extra::{
    TypedHeader,
    headers::{ContentLength, ContentType},
};
use image::ImageOutputFormat;

use crate::{
    deserialization::RenderConfig,
    tracing::{Render, RenderID, RenderManager, RenderStorage},
};

pub async fn index() -> String {
    println!("Handing request for index...");
    String::from("Hello, world!\n")
}

pub async fn create_render<S: RenderStorage>(
    State(render_manager): State<RenderManager<S>>,
    Json(render_config): Json<RenderConfig>,
) -> Response {
    println!("Handing request for create_render...");

    if let Err(e) = render_config.compile() {
        println!("Failed to compile render data: {e}");
        return (StatusCode::BAD_REQUEST, e.to_string()).into_response();
    };

    match render_manager.create_render(render_config).await {
        Ok(render) => (StatusCode::CREATED, Json(render)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e).into_response(),
    }
}

pub async fn get_render<S: RenderStorage>(
    State(render_manager): State<RenderManager<S>>,
    Path(id): Path<RenderID>,
) -> Response {
    println!("Handing request for get_render...");

    match render_manager.get_render(id).await {
        Ok(Some(render)) => Json(render).into_response(),
        Ok(None) => StatusCode::NOT_FOUND.into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e).into_response(),
    }
}

pub async fn get_all_renders<S: RenderStorage>(
    State(render_manager): State<RenderManager<S>>,
) -> Response {
    println!("Handing request for get_all_renders...");

    match render_manager.get_all_renders().await {
        Ok(renders) => Json(renders).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e).into_response(),
    }
}

pub async fn get_render_checkpoint_image<S: RenderStorage>(
    State(render_manager): State<RenderManager<S>>,
    Path((id, checkpoint_iteration)): Path<(RenderID, u32)>,
) -> Response {
    println!("Handing request for get_render_checkpoint...");

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
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e).into_response(),
    }
}
