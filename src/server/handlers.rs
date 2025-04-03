use std::{io::Cursor, sync::Arc};

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
    tracing::{Render, RenderID, RenderManager, RenderManagerError, RenderState},
    utils::FormattedProgressInfo,
};

use serde::{Deserialize, Serialize};

#[derive(Serialize)]
struct FormattedRender {
    id: RenderID,
    state: FormattedRenderState,
    config: RenderConfig,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "snake_case")]
enum FormattedRenderState {
    Created,
    Running {
        checkpoint_iteration: u32,
        progress_info: FormattedProgressInfo,
    },
    FinishedCheckpointIteration(u32),
    Pausing {
        checkpoint_iteration: u32,
        progress_info: FormattedProgressInfo,
    },
    Paused(u32),
}

impl From<RenderState> for FormattedRenderState {
    fn from(state: RenderState) -> Self {
        match state {
            RenderState::Created => FormattedRenderState::Created,
            RenderState::Running {
                checkpoint_iteration,
                progress_info,
            } => FormattedRenderState::Running {
                checkpoint_iteration,
                progress_info: progress_info.into(),
            },
            RenderState::FinishedCheckpointIteration(i) => {
                FormattedRenderState::FinishedCheckpointIteration(i)
            }
            RenderState::Pausing {
                checkpoint_iteration,
                progress_info,
            } => FormattedRenderState::Pausing {
                checkpoint_iteration,
                progress_info: progress_info.into(),
            },
            RenderState::Paused(i) => FormattedRenderState::Paused(i),
        }
    }
}

impl From<Render> for FormattedRender {
    fn from(render: Render) -> Self {
        Self {
            id: render.id,
            config: render.config,
            state: render.state.into(),
        }
    }
}

pub type LuxideState = State<Arc<RenderManager>>;

pub async fn index() -> String {
    println!("Handing request for index...");
    String::from("Hello, world!\n")
}

pub async fn create_render(
    State(render_manager): LuxideState,
    Json(render_config): Json<RenderConfig>,
) -> Response {
    println!("Handing request for create_render...");

    if let Err(e) = render_config.compile() {
        println!("Failed to compile render data: {e}");
        return (StatusCode::BAD_REQUEST, e.to_string()).into_response();
    };

    match render_manager.create_render(render_config).await {
        Ok(render) => (StatusCode::CREATED, Json(render)).into_response(),
        Err(e) => e.into(),
    }
}

pub async fn get_render(State(render_manager): LuxideState, Path(id): Path<RenderID>) -> Response {
    println!("Handing request for get_render...");

    match render_manager.get_render(id).await {
        Ok(Some(render)) => Json(FormattedRender::from(render)).into_response(),
        Ok(None) => StatusCode::NOT_FOUND.into_response(),
        Err(e) => e.into(),
    }
}

pub async fn get_all_renders(State(render_manager): LuxideState) -> Response {
    println!("Handing request for get_all_renders...");

    match render_manager.get_all_renders().await {
        Ok(renders) => {
            let formatted_renders: Vec<FormattedRender> =
                renders.into_iter().map(FormattedRender::from).collect();
            Json(formatted_renders).into_response()
        }
        Err(e) => e.into(),
    }
}

pub async fn delete_render(
    State(render_manager): LuxideState,
    Path(id): Path<RenderID>,
) -> Response {
    match render_manager.delete_render_and_checkpoints(id).await {
        Ok(()) => StatusCode::NO_CONTENT.into_response(),
        Err(e) => e.into(),
    }
}

pub async fn pause_render(
    State(render_manager): LuxideState,
    Path(id): Path<RenderID>,
) -> Response {
    match render_manager.pause_render(id).await {
        Ok(_) => StatusCode::NO_CONTENT.into_response(),
        Err(e) => e.into(),
    }
}

pub async fn resume_render(
    State(render_manager): LuxideState,
    Path(id): Path<RenderID>,
) -> Response {
    match render_manager.resume_render(id).await {
        Ok(_) => StatusCode::NO_CONTENT.into_response(),
        Err(e) => e.into(),
    }
}

#[derive(Clone, Copy, Serialize, Deserialize)]
pub struct ExtendRenderParameters {
    new_total_checkpoints: u32,
}

pub async fn extend_render(
    State(render_manager): LuxideState,
    Path(id): Path<RenderID>,
    Json(extend_render_parameters): Json<ExtendRenderParameters>,
) -> Response {
    match render_manager
        .extend_render(id, extend_render_parameters.new_total_checkpoints)
        .await
    {
        Ok(_) => StatusCode::NO_CONTENT.into_response(),
        Err(e) => e.into(),
    }
}

pub async fn get_render_checkpoint_image(
    State(render_manager): LuxideState,
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
        Err(e) => e.into(),
    }
}

impl From<RenderManagerError> for Response {
    fn from(error: RenderManagerError) -> Self {
        match error {
            RenderManagerError::ClientError(code, err) => (code, err).into_response(),
            RenderManagerError::ServerError(err) => {
                (StatusCode::INTERNAL_SERVER_ERROR, err).into_response()
            }
        }
    }
}
