use std::io::Cursor;

use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use axum_extra::{
    headers::{ContentLength, ContentType},
    TypedHeader,
};
use image::ImageOutputFormat;
use serde::Serialize;

use crate::deserialization::RenderConfig;

use super::{RenderInfo, RenderManager};

pub async fn index() -> String {
    println!("Handing request for index...");
    String::from("Hello, world!\n")
}

#[derive(Serialize)]
pub struct RenderInfoResponse {
    id: u64,

    #[serde(flatten)]
    render_info: RenderInfo,
}

pub async fn create_render(
    State(render_manager): State<RenderManager>,
    Json(render_config): Json<RenderConfig>,
) -> Response {
    println!("Handing request for create_render...");

    let render_data = match render_config.compile() {
        Ok(data) => data,
        Err(e) => {
            println!("Failed to compile render data: {e}");
            return (StatusCode::BAD_REQUEST, e.to_string()).into_response();
        }
    };

    let (id, created_render_info) = render_manager.create_render(render_data);

    (
        StatusCode::CREATED,
        Json(RenderInfoResponse {
            id,
            render_info: created_render_info,
        }),
    )
        .into_response()
}

pub async fn get_all_render_info(
    State(render_manager): State<RenderManager>,
) -> Json<Vec<RenderInfoResponse>> {
    println!("Handing request for get_all_render_info...");

    let renders_info = render_manager.get_all_render_info();

    Json(
        renders_info
            .iter()
            .map(|(&id, info)| RenderInfoResponse {
                id,
                render_info: info.clone(),
            })
            .collect(),
    )
}

pub async fn get_render_info(
    State(render_manager): State<RenderManager>,
    Path(id): Path<u64>,
) -> Response {
    println!("Handing request for get_render_info...");

    match render_manager.get_render_info(id) {
        Some(info) => Json(info).into_response(),
        None => StatusCode::NOT_FOUND.into_response(),
    }
}

pub async fn get_render_image(
    State(render_manager): State<RenderManager>,
    Path(id): Path<u64>,
) -> Response {
    println!("Handing request for get_render_image...");

    match render_manager.get_render_image(id) {
        Some(image) => {
            // write image to intermediate buffer
            let mut img_buffer = Vec::new();

            if let Err(err) =
                image.write_to(&mut Cursor::new(&mut img_buffer), ImageOutputFormat::Png)
            {
                println!("Failed to write image to buffer: {err}");
                return (StatusCode::INTERNAL_SERVER_ERROR, err.to_string()).into_response();
            }

            // base64 encode buffer
            // let base64_encoded_img = BASE64_STANDARD.encode(img_buffer);

            // return response, ensuring we set the Content-Type header to image/png;base64
            (
                StatusCode::OK,
                TypedHeader(ContentType::png()),
                TypedHeader(ContentLength(img_buffer.len() as u64)),
                img_buffer,
            )
                .into_response()
        }
        None => StatusCode::NOT_FOUND.into_response(),
    }
}
