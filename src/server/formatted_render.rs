use serde::{Deserialize, Serialize};

use crate::{
    deserialization::RenderConfig,
    tracing::{Render, RenderID, RenderParameters, RenderState},
    utils::FormattedProgressInfo,
};

#[derive(Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RenderFormat {
    Full,
    Light,
    Minimal,
}

impl Default for RenderFormat {
    fn default() -> Self {
        RenderFormat::Full
    }
}

#[derive(Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct RenderFormatQueryParameters {
    pub format: Option<RenderFormat>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum FormattedRenderState {
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

#[derive(Clone, Serialize)]
#[serde(untagged)]
pub enum FormattedRender {
    Full(FormattedRenderFull),
    Light(FormattedRenderLight),
    Minimal(FormattedRenderMinimal),
}

impl From<(RenderFormat, Render)> for FormattedRender {
    fn from((format, render): (RenderFormat, Render)) -> Self {
        match (format, render) {
            (RenderFormat::Full, r) => FormattedRender::Full(FormattedRenderFull::from(r)),
            (RenderFormat::Light, r) => FormattedRender::Light(FormattedRenderLight::from(r)),
            (RenderFormat::Minimal, r) => FormattedRender::Minimal(FormattedRenderMinimal::from(r)),
        }
    }
}

#[derive(Clone, Serialize)]
pub struct FormattedRenderFull {
    id: RenderID,
    state: FormattedRenderState,
    created_at: chrono::DateTime<chrono::Utc>,
    updated_at: chrono::DateTime<chrono::Utc>,
    config: RenderConfig,
}

impl From<Render> for FormattedRenderFull {
    fn from(render: Render) -> Self {
        Self {
            id: render.id,
            state: render.state.into(),
            created_at: render.created_at,
            updated_at: render.updated_at,
            config: render.config,
        }
    }
}

#[derive(Clone, Serialize)]
pub struct FormattedRenderLight {
    id: RenderID,
    name: String,
    created_at: chrono::DateTime<chrono::Utc>,
    updated_at: chrono::DateTime<chrono::Utc>,
    state: FormattedRenderState,
    parameters: RenderParameters,
}

impl From<Render> for FormattedRenderLight {
    fn from(render: Render) -> Self {
        Self {
            id: render.id,
            state: render.state.into(),
            created_at: render.created_at,
            updated_at: render.updated_at,
            name: render.config.name,
            parameters: render.config.parameters,
        }
    }
}

#[derive(Clone, Serialize)]
pub struct FormattedRenderMinimal {
    id: RenderID,
    name: String,
    created_at: chrono::DateTime<chrono::Utc>,
    updated_at: chrono::DateTime<chrono::Utc>,
    state: FormattedRenderState,
}

impl From<Render> for FormattedRenderMinimal {
    fn from(render: Render) -> Self {
        Self {
            id: render.id,
            name: render.config.name,
            created_at: render.created_at,
            updated_at: render.updated_at,
            state: render.state.into(),
        }
    }
}
