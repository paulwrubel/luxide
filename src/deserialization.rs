use std::sync::Arc;

use geometrics::GeometricRefOrInline;
use indexmap::IndexMap;
use serde::{Deserialize, Serialize};
use textures::TextureRefOrInline;

use crate::{
    camera::Camera,
    geometry::Geometric,
    shading::{Texture, materials::Material},
    tracing::{RenderParameters, Scene},
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

#[derive(Clone, Serialize, Deserialize)]
pub struct RenderConfig {
    pub parameters: RenderParameters,
    pub active_scene: SceneRefOrInline,
    #[serde(default)]
    pub scenes: IndexMap<String, SceneData>,
    #[serde(default)]
    pub cameras: IndexMap<String, CameraData>,
    #[serde(default)]
    pub textures: IndexMap<String, TextureData>,
    #[serde(default)]
    pub materials: IndexMap<String, MaterialData>,
    #[serde(default)]
    pub geometrics: IndexMap<String, GeometricData>,
}

impl RenderConfig {
    pub fn name(&self) -> &str {
        match &self.active_scene {
            SceneRefOrInline::Ref(name) => name,
            SceneRefOrInline::Inline(s) => &s.name,
        }
    }
}

impl RenderConfig {
    pub fn compile(&self) -> Result<RenderData, String> {
        let mut builts = Builts::new();

        // setup named properties
        build_textures(&self.textures, &mut builts)?;
        build_materials(&self.materials, &mut builts)?;
        build_geometrics(&self.geometrics, &mut builts)?;
        build_cameras(&self.cameras, &mut builts)?;
        build_scenes(&self.scenes, &mut builts)?;

        let active_scene = self.active_scene.build(&builts)?;

        Ok(RenderData {
            parameters: self.parameters.clone(),
            scene: active_scene,
        })
    }
}

#[derive(Clone)]
pub struct RenderData {
    pub parameters: RenderParameters,
    pub scene: Scene,
}

fn build_textures(
    texture_data: &IndexMap<String, TextureData>,
    builts: &mut Builts,
) -> Result<(), String> {
    let mut building = std::collections::HashSet::new();

    // Function to get dependencies from a texture
    let get_dependencies = |texture: &TextureData| {
        let mut deps = Vec::new();
        match texture {
            TextureData::Checker {
                even_texture,
                odd_texture,
                ..
            } => {
                if let TextureRefOrInline::Ref(ref_name) = even_texture {
                    deps.push(ref_name.clone());
                }
                if let TextureRefOrInline::Ref(ref_name) = odd_texture {
                    deps.push(ref_name.clone());
                }
            }
            _ => {}
        }
        deps
    };

    // Function to build and insert a texture
    let build_and_insert = |name: &str, texture: &TextureData, builts: &mut Builts| {
        if !builts.textures.contains_key(name) {
            let built = texture.build(builts)?;
            builts.textures.insert(name.to_string(), built);
        }
        Ok(())
    };

    // Build all textures
    for name in texture_data.keys() {
        build_resource_recursive(
            name,
            texture_data,
            builts,
            &mut building,
            get_dependencies,
            build_and_insert,
            "texture",
            0,
        )?
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
    let mut building = std::collections::HashSet::new();

    // Function to get dependencies from a geometric
    let get_dependencies = |geometric: &GeometricData| {
        let mut deps = Vec::new();
        match geometric {
            GeometricData::CompoundList { geometrics, .. } => {
                for g in geometrics {
                    if let GeometricRefOrInline::Ref(ref_name) = g {
                        deps.push(ref_name.clone());
                    }
                }
            }
            GeometricData::InstanceRotateXAxis { geometric, .. }
            | GeometricData::InstanceRotateYAxis { geometric, .. }
            | GeometricData::InstanceRotateZAxis { geometric, .. }
            | GeometricData::InstanceTranslate { geometric, .. } => {
                if let GeometricRefOrInline::Ref(ref_name) = geometric {
                    deps.push(ref_name.clone());
                }
            }
            _ => {}
        }
        deps
    };

    // Function to build and insert a geometric
    let build_and_insert = |name: &str, geometric: &GeometricData, builts: &mut Builts| {
        if !builts.geometrics.contains_key(name) {
            let built = geometric.build(builts)?;
            builts.geometrics.insert(name.to_string(), built);
        }
        Ok(())
    };

    // Build all geometrics
    for name in geometric_data.keys() {
        build_resource_recursive(
            name,
            geometric_data,
            builts,
            &mut building,
            get_dependencies,
            build_and_insert,
            "geometric",
            0,
        )?
    }
    Ok(())
}

const MAX_RECURSION_DEPTH: usize = 100;

fn build_resource_recursive<T>(
    name: &str,
    resource_data: &IndexMap<String, T>,
    builts: &mut Builts,
    building: &mut std::collections::HashSet<String>,
    get_dependencies: impl Fn(&T) -> Vec<String> + Copy,
    build_and_insert: impl Fn(&str, &T, &mut Builts) -> Result<(), String> + Copy,
    resource_type: &str,
    depth: usize,
) -> Result<(), String> {
    // Check for maximum recursion depth
    if depth >= MAX_RECURSION_DEPTH {
        return Err(format!(
            "Maximum recursion depth ({}) exceeded while building {} '{}'. This may indicate a cyclic dependency.",
            MAX_RECURSION_DEPTH, resource_type, name
        ));
    }

    // If we've already built this resource, we're done
    if building.contains(name) {
        return Err(format!(
            "Cycle detected in {} dependencies involving {}",
            resource_type, name
        ));
    }

    // Get the resource data
    let resource = resource_data.get(name).ok_or(format!(
        "{} {} not found. Is it specified in the {} list?",
        resource_type, name, resource_type
    ))?;

    // Mark that we're building this resource
    building.insert(name.to_string());

    // Build any referenced resources first
    for dep_name in get_dependencies(resource) {
        build_resource_recursive(
            &dep_name,
            resource_data,
            builts,
            building,
            get_dependencies,
            build_and_insert,
            resource_type,
            depth + 1,
        )?
    }

    // Now build this resource if it hasn't been built yet
    build_and_insert(name, resource, builts)?;
    building.remove(name);

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
