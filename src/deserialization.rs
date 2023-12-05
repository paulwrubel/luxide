use std::{fs, marker::PhantomData, sync::Arc};

use indexmap::IndexMap;
use serde::Deserialize;

use crate::{
    camera::Camera,
    geometry::{
        compounds::{AxisAlignedPBox, List, BVH},
        instances::{RotateYAxis, Translate},
        primitives::{Parallelogram, Sphere},
        volumes, Geometric, Point,
    },
    parameters::Parameters,
    scene::Scene,
    shading::{
        materials::{Dielectric, Lambertian, Material, Specular},
        textures::{Checker, Image8Bit, SolidColor},
        Texture,
    },
    utils::Angle,
};

mod scenes;
use self::scenes::{SceneData, SceneRefOrInline};

mod cameras;
use self::cameras::CameraData;

mod geometrics;
use self::geometrics::GeometricData;

mod materials;
use self::materials::MaterialData;

mod textures;
use self::textures::TextureData;

pub trait Build<Inst> {
    fn build(&self, builts: &Builts) -> Result<Inst, String>;
}

pub struct Builts {
    scenes: IndexMap<String, Scene>,
    cameras: IndexMap<String, Camera>,
    geometrics: IndexMap<String, Arc<dyn Geometric>>,
    materials: IndexMap<String, Arc<dyn Material>>,
    textures: IndexMap<String, Arc<dyn Texture>>,
}

impl Builts {
    fn new() -> Self {
        Self {
            scenes: IndexMap::new(),
            cameras: IndexMap::new(),
            geometrics: IndexMap::new(),
            materials: IndexMap::new(),
            textures: IndexMap::new(),
        }
    }
}

#[derive(Deserialize)]
struct RenderData {
    parameters: Parameters,
    scene: SceneRefOrInline,
    #[serde(default)]
    scenes: IndexMap<String, SceneData>,
    #[serde(default)]
    cameras: IndexMap<String, CameraData>,
    #[serde(default)]
    textures: IndexMap<String, TextureData>,
    #[serde(default)]
    materials: IndexMap<String, MaterialData>,
    #[serde(default)]
    geometrics: IndexMap<String, GeometricData>,
}

pub fn parse_yaml(filename: &str) -> Result<(Parameters, Scene), String> {
    // get and parse file
    let unparsed = fs::read_to_string(filename).map_err(|err| err.to_string())?;
    let parsed: RenderData = serde_yaml::from_str(&unparsed).map_err(|err| err.to_string())?;

    let mut builts = Builts::new();

    // setup named properties
    build_textures(&parsed.textures, &mut builts)?;
    build_materials(&parsed.materials, &mut builts)?;
    build_geometrics(&parsed.geometrics, &mut builts)?;
    build_cameras(&parsed.cameras, &mut builts)?;
    build_scenes(&parsed.scenes, &mut builts)?;

    // let scene_name = match &parsed.scene {
    //     SceneRefOrInline::Ref(name) => name.clone(),
    //     SceneRefOrInline::Inline(SceneData { name, .. }) => name.clone(),
    // };

    let selected_scene = parsed.scene.build(&builts)?;

    // let selected_scene = scenes.remove(&parsed.scene).ok_or(format!(
    //     "Scene {} not found. Is it specified in the scenes list?",
    //     parsed.scene
    // ))?;

    Ok((parsed.parameters, selected_scene))
}

// #[derive(Deserialize)]
// #[serde(rename_all = "snake_case")]
// pub enum RefOrInline<Data, Inst> {
//     Ref(String),
//     Inline(Data, PhantomData<Inst>),
// }

// impl<Data, Inst> RefOrInline<Data, Inst>
// where
//     Data: Build<Inst>,
// {
//     fn build(&self, source: &IndexMap<String, Inst>, builts: &Builts) -> Result<Inst, String> {
//         match self {
//             Self::Ref(name) => Ok(*source
//                 .get(name)
//                 .ok_or(format!("Reference {} not found", name))?),
// Self::Ref(name) => match property {
//     Property::Scene => Ok(builts
//         .scenes
//         .get(name)
//         .ok_or(format!("Scene Reference {} not found", name))?),
//     Property::Camera => Ok(builts
//         .cameras
//         .get(name)
//         .ok_or(format!("Camera Reference {} not found", name))?),
//     Property::Geometric => Ok(builts
//         .geometrics
//         .get(name)
//         .ok_or(format!("Geometric Reference {} not found", name))?),
//     Property::Material => Ok(builts
//         .materials
//         .get(name)
//         .ok_or(format!("Material Reference {} not found", name))?),
//     Property::Texture => Ok(builts
//         .textures
//         .get(name)
//         .ok_or(format!("Texture Reference {} not found", name))?),
// },
//             Self::Inline(data, _) => data.build(builts),
//         }
//     }
// }

// impl<Data: Build<Inst>, Inst> RefOrInline<Data> {
//     fn build_or_deref(&self, source: &IndexMap<String, Inst>) -> Result<Inst, String> {
//         match self {
//             Self::Ref(name) => source.get(name)?,
//             Self::Inline(data) => data.build()?,
//         }
//     }
// }

fn build_textures(
    texture_data: &IndexMap<String, TextureData>,
    builts: &mut Builts,
) -> Result<(), String> {
    for (name, texture) in texture_data {
        builts
            .textures
            .insert((*name).clone(), texture.build(builts)?);
    }
    Ok(())
}

fn build_materials(
    material_data: &IndexMap<String, MaterialData>,
    builts: &mut Builts,
) -> Result<(), String> {
    for (name, material) in material_data {
        builts
            .materials
            .insert((*name).clone(), material.build(builts)?);
    }
    Ok(())
}

fn build_geometrics(
    geometric_data: &IndexMap<String, GeometricData>,
    builts: &mut Builts,
) -> Result<(), String> {
    for (name, geometric) in geometric_data {
        builts
            .geometrics
            .insert((*name).clone(), geometric.build(builts)?);
    }
    Ok(())
}

fn build_cameras(
    camera_data: &IndexMap<String, CameraData>,
    builts: &mut Builts,
) -> Result<(), String> {
    for (name, camera_data) in camera_data {
        builts
            .cameras
            .insert((*name).clone(), camera_data.build(builts)?);
    }
    Ok(())
}

fn build_scenes(
    scene_data: &IndexMap<String, SceneData>,
    builts: &mut Builts,
) -> Result<(), String> {
    for (name, scene_data) in scene_data {
        builts
            .scenes
            .insert((*name).clone(), scene_data.build(builts)?);
    }
    Ok(())
}
