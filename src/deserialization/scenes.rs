use std::sync::Arc;

use indexmap::IndexMap;
use serde::Deserialize;

use crate::{
    camera::Camera,
    geometry::{
        compounds::{List, BVH},
        Geometric,
    },
    scene::Scene,
};

use super::{Build, Builts};

#[derive(Deserialize)]
#[serde(rename_all = "snake_case")]
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
pub struct SceneData {
    name: String,
    geometrics: Vec<String>,
    use_bvh: bool,
    camera: String,
    background_color: [f64; 3],
}

impl Build<Scene> for SceneData {
    fn build(&self, builts: &Builts) -> Result<Scene, String> {
        let mut world = List::new();
        for geometric_name in &self.geometrics {
            let geometric = builts.geometrics.get(geometric_name).ok_or(format!(
                "Geometric {} not found. Is it specified in the geometrics list?",
                geometric_name
            ))?;
            world.push(Arc::clone(geometric));
        }
        let camera = builts.cameras.get(&self.camera).ok_or(format!(
            "Camera {} not found. Is it specified in the cameras list?",
            &self.camera
        ))?;
        let scene = Scene {
            name: self.name.clone(),
            world: if self.use_bvh {
                Arc::new(BVH::from_list(world))
            } else {
                Arc::new(world)
            },
            camera: (*camera).clone(),
            background_color: self.background_color.into(),
        };

        Ok(scene)
    }
}
