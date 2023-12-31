use std::sync::Arc;

use serde::Deserialize;

use crate::{
    geometry::compounds::{List, BVH},
    scene::Scene,
};

use super::{cameras::CameraRefOrInline, geometrics::GeometricRefOrInline, Build, Builts};

#[derive(Deserialize)]
#[serde(rename_all = "snake_case")]
#[serde(untagged)]
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
                .ok_or(format!(
                    "Scene {} not found. Is it specified in the scenes list?",
                    name
                ))?
                .clone()),
            Self::Inline(data) => data.build(builts),
        }
    }
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
pub struct SceneData {
    name: String,
    geometrics: Vec<GeometricRefOrInline>,
    use_bvh: bool,
    camera: CameraRefOrInline,
    background_color: [f64; 3],
}

impl Build<Scene> for SceneData {
    fn build(&self, builts: &Builts) -> Result<Scene, String> {
        let mut world = List::new();
        for geometric in &self.geometrics {
            let geometric = geometric.build(builts)?;
            world.push(geometric);
        }
        let camera = self.camera.build(builts)?;
        let scene = Scene {
            name: self.name.clone(),
            world: if self.use_bvh {
                Arc::new(BVH::from_list(world))
            } else {
                Arc::new(world)
            },
            camera,
            background_color: self.background_color.into(),
        };

        Ok(scene)
    }
}
