use axum::{
    extract::State,
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};

use crate::deserialization::RenderConfig;

use super::RenderJobManager;

pub async fn index() -> String {
    println!("Handing request for index...");
    String::from("Hello, world!\n")
}

pub async fn create_render_job(
    State(job_manager): State<RenderJobManager>,
    Json(render_config): Json<RenderConfig>,
) -> Response {
    println!("Handing request for create_render_job...");

    let render_data = match render_config.compile() {
        Ok(data) => data,
        Err(e) => {
            println!("Failed to compile render data: {e}");
            return (StatusCode::BAD_REQUEST, e.to_string()).into_response();
        }
    };

    let created_job_info = job_manager.create_job(render_data);

    (StatusCode::CREATED, Json(created_job_info)).into_response()
}
