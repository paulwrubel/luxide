use std::collections::HashMap;

use axum::{
    extract::State,
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::Serialize;

use crate::deserialization::RenderConfig;

use super::{RenderJobInfo, RenderJobManager};

pub async fn index() -> String {
    println!("Handing request for index...");
    String::from("Hello, world!\n")
}

#[derive(Serialize)]
pub struct RenderJobInfoResponse {
    id: u64,

    #[serde(flatten)]
    render_job_info: RenderJobInfo,
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

    let (id, created_job_info) = job_manager.create_job(render_data);

    (
        StatusCode::CREATED,
        Json(RenderJobInfoResponse {
            id,
            render_job_info: created_job_info,
        }),
    )
        .into_response()
}

pub async fn get_all_render_jobs_info(
    State(job_manager): State<RenderJobManager>,
) -> Json<HashMap<u64, RenderJobInfo>> {
    println!("Handing request for get_all_job_info...");

    let jobs_info = job_manager.get_all_job_info();

    Json(jobs_info)
}
