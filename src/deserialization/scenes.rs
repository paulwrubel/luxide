use serde::{Deserialize, Serialize};

use crate::tracing::{Scene, SceneWorld};

use super::{Build, Builts, cameras::CameraRefOrInline, geometrics::GeometricRefOrInline};

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case", untagged)]
pub enum SceneRefOrInline {
    Ref(String),
    Inline(SceneData),
}

impl Build<Scene> for SceneRefOrInline {
    fn build(&self, builts: &Builts) -> Result<Scene, String> {
        match self {
            Self::Ref(name) => Ok(builts
                .scenes
                .get(name)
                .ok_or_else(|| {
                    format!(
                        "Scene {} not found. Is it specified in the scenes list?",
                        name
                    )
                })?
                .clone()),
            Self::Inline(data) => data.build(builts),
        }
    }
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct SceneData {
    pub geometrics: Vec<GeometricRefOrInline>,
    pub use_bvh: bool,
    pub camera: CameraRefOrInline,
    pub background_color: [f64; 3],
}

impl Build<Scene> for SceneData {
    fn build(&self, builts: &Builts) -> Result<Scene, String> {
        let mut world = Vec::new();
        let mut world_virtual = Vec::new();

        for geometric in &self.geometrics {
            let geometric = geometric.build(builts)?;
            if geometric.is_virtual() {
                world_virtual.push(geometric);
            } else {
                world.push(geometric);
            }
        }
        let camera = self.camera.build(builts)?;
        let scene = Scene {
            world: SceneWorld::from_geometrics(&world, &world_virtual, self.use_bvh),
            camera,
            background_color: self.background_color.into(),
        };

        Ok(scene)
    }
}
