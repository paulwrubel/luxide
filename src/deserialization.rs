use std::sync::Arc;

use cameras::{CameraRefOrInline, FocusDistance, FocusDistanceType};
use geometrics::GeometricRefOrInline;
use indexmap::{IndexMap, indexmap};
use materials::MaterialRefOrInline;
use serde::{Deserialize, Serialize};
use textures::TextureRefOrInline;

use crate::{
    camera::Camera,
    geometry::Geometric,
    shading::{Color, Texture, materials::Material},
    tracing::{RenderParameters, Scene, User},
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

pub struct RenderConfigBuilder(RenderConfig);

impl RenderConfigBuilder {
    pub fn build(self) -> RenderConfig {
        self.0
    }

    pub fn with_builtins(mut self) -> Self {
        // builtin resources can be "overwritten" by user-defined resources
        // so we have to make sure that we add them last
        self.0.textures.append(&mut get_builtin_textures());
        self.0.materials.append(&mut get_builtin_materials());
        self.0.geometrics.append(&mut get_builtin_geometrics());
        self.0.cameras.append(&mut get_builtin_cameras());
        self.0.scenes.append(&mut get_builtin_scenes());

        self
    }

    pub fn with_overriding_limits(mut self, user: &User) -> Self {
        let render_limit = self.0.parameters.saved_checkpoint_limit;
        let user_limit = user.max_checkpoints_per_render;

        match (render_limit, user_limit) {
            // user requested a limit that's higher than their permitted limit
            (Some(render_limit), Some(user_limit)) if user_limit < render_limit => {
                self.0.parameters.saved_checkpoint_limit = Some(user_limit);
            }
            // user requested no limit, but their permitted limit is non-zero
            (None, Some(user_limit)) => {
                self.0.parameters.saved_checkpoint_limit = Some(user_limit);
            }
            _ => {}
        }

        self
    }
}

impl From<RenderConfig> for RenderConfigBuilder {
    fn from(config: RenderConfig) -> Self {
        Self(config)
    }
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct RenderConfig {
    pub name: String,
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

fn get_geometric_dependencies(geometric: &GeometricData) -> Vec<String> {
    let mut deps = Vec::new();
    match geometric {
        GeometricData::CompoundList { geometrics, .. } => {
            for g in geometrics {
                match g {
                    GeometricRefOrInline::Ref(ref_name) => deps.push(ref_name.clone()),
                    GeometricRefOrInline::Inline(data) => {
                        deps.append(&mut get_geometric_dependencies(data))
                    }
                }
            }
        }
        GeometricData::InstanceRotateXAxis { geometric, .. }
        | GeometricData::InstanceRotateYAxis { geometric, .. }
        | GeometricData::InstanceRotateZAxis { geometric, .. }
        | GeometricData::InstanceTranslate { geometric, .. } => match geometric {
            GeometricRefOrInline::Ref(ref_name) => deps.push(ref_name.clone()),
            GeometricRefOrInline::Inline(data) => {
                deps.append(&mut get_geometric_dependencies(data))
            }
        },
        _ => {}
    }
    deps
}

fn build_geometrics(
    geometric_data: &IndexMap<String, GeometricData>,
    builts: &mut Builts,
) -> Result<(), String> {
    let mut building = std::collections::HashSet::new();

    // Function to get dependencies from a geometric
    // let get_dependencies = |geometric: &GeometricData| {};

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
            get_geometric_dependencies,
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

    // Check for cycles
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

const BUILT_IN_RESOURCE_PREFIX: &str = "__";

fn prefix_builtin_key(key: &str) -> String {
    format!("{}{}", BUILT_IN_RESOURCE_PREFIX, key)
}

fn get_builtin_textures() -> IndexMap<String, TextureData> {
    indexmap! {
        prefix_builtin_key("white") => TextureData::SolidColor {
            color: Color::WHITE.into()
         },
        prefix_builtin_key("black") => TextureData::SolidColor {
            color: Color::BLACK.into()
        },
        prefix_builtin_key("red") => TextureData::SolidColor {
             color: Color::RED.into()
            },
        prefix_builtin_key("green") => TextureData::SolidColor {
            color: Color::GREEN.into()
         },
        prefix_builtin_key("blue") => TextureData::SolidColor {
            color: Color::BLUE.into()
        },
        // cornell box colors
        prefix_builtin_key("cornell_box_white") => TextureData::SolidColor {
            color: [0.73, 0.73, 0.73],
        },
        prefix_builtin_key("cornell_box_white_light") => TextureData::SolidColor {
            color: [7.0, 7.0, 7.0],
        },
        prefix_builtin_key("cornell_box_red") => TextureData::SolidColor {
            color: [0.65, 0.05, 0.05],
        },
        prefix_builtin_key("cornell_box_green") => TextureData::SolidColor {
            color: [0.12, 0.45, 0.15],
        },
    }
}

fn get_builtin_materials() -> IndexMap<String, MaterialData> {
    let texture_fn = |color_name: &str| TextureRefOrInline::Ref(prefix_builtin_key(color_name));

    indexmap! {
        // lambertian
        prefix_builtin_key("lambertian_white") => MaterialData::Lambertian {
            reflectance_texture: texture_fn("white"),
            emittance_texture: texture_fn("black"),
        },
        prefix_builtin_key("lambertian_black") => MaterialData::Lambertian {
            reflectance_texture: texture_fn("black"),
            emittance_texture: texture_fn("black"),
        },
        prefix_builtin_key("lambertian_red") => MaterialData::Lambertian {
            reflectance_texture: texture_fn("red"),
            emittance_texture: texture_fn("black"),
        },
        prefix_builtin_key("lambertian_green") => MaterialData::Lambertian {
            reflectance_texture: texture_fn("green"),
            emittance_texture: texture_fn("black"),
        },
        prefix_builtin_key("lambertian_blue") => MaterialData::Lambertian {
            reflectance_texture: texture_fn("blue"),
            emittance_texture: texture_fn("black"),
        },

        // specular
        prefix_builtin_key("specular_mirror") => MaterialData::Specular {
            reflectance_texture: texture_fn("white"),
            emittance_texture: texture_fn("black"),
            roughness: 0.0,
        },
        prefix_builtin_key("specular_mirror_rough") => MaterialData::Specular {
            reflectance_texture: texture_fn("white"),
            emittance_texture: texture_fn("black"),
            roughness: 0.1,
        },

        // dielectric
        prefix_builtin_key("dielectric_glass") => MaterialData::Dielectric {
            reflectance_texture: texture_fn("white"),
            emittance_texture: texture_fn("black"),
            index_of_refraction: 1.52,
        },
        prefix_builtin_key("dielectric_water") => MaterialData::Dielectric {
            reflectance_texture: texture_fn("white"),
            emittance_texture: texture_fn("black"),
            index_of_refraction: 1.333,
        },
        prefix_builtin_key("dielectric_diamond") => MaterialData::Dielectric {
            reflectance_texture: texture_fn("white"),
            emittance_texture: texture_fn("black"),
            index_of_refraction: 2.417,
        },

        // cornell box materials
        prefix_builtin_key("lambertian_cornell_box_white") => MaterialData::Lambertian {
            reflectance_texture: texture_fn("cornell_box_white"),
            emittance_texture: texture_fn("black"),
        },
        prefix_builtin_key("lambertian_cornell_box_white_light") => MaterialData::Lambertian {
            reflectance_texture: texture_fn("black"),
            emittance_texture: texture_fn("cornell_box_white_light"),
        },
        prefix_builtin_key("lambertian_cornell_box_red") => MaterialData::Lambertian {
            reflectance_texture: texture_fn("cornell_box_red"),
            emittance_texture: texture_fn("black"),
        },
        prefix_builtin_key("lambertian_cornell_box_green") => MaterialData::Lambertian {
            reflectance_texture: texture_fn("cornell_box_green"),
            emittance_texture: texture_fn("black"),
        },
    }
}

fn get_builtin_geometrics() -> IndexMap<String, GeometricData> {
    let material_fn =
        |material_name: &str| MaterialRefOrInline::Ref(prefix_builtin_key(material_name));

    indexmap! {
        prefix_builtin_key("cornell_box_left_wall") => GeometricData::PrimitiveParallelogram {
            lower_left: [0.0, 0.0, 0.0],
            u: [0.0, 0.0, -1.0],
            v: [0.0, 1.0, 0.0],
            is_culled: None,
            material: material_fn("lambertian_cornell_box_green"),
        },
        prefix_builtin_key("cornell_box_right_wall") => GeometricData::PrimitiveParallelogram {
            lower_left: [1.0, 0.0, -1.0],
            u: [0.0, 0.0, 1.0],
            v: [0.0, 1.0, 0.0],
            is_culled: None,
            material: material_fn("lambertian_cornell_box_red"),
        },
        prefix_builtin_key("cornell_box_floor") => GeometricData::PrimitiveParallelogram {
            lower_left: [0.0, 0.0, 0.0],
            u: [1.0, 0.0, 0.0],
            v: [0.0, 0.0, -1.0],
            is_culled: None,
            material: material_fn("lambertian_cornell_box_white"),
        },
        prefix_builtin_key("cornell_box_ceiling") => GeometricData::PrimitiveParallelogram {
            lower_left: [0.0, 1.0, -1.0],
            u: [1.0, 0.0, 0.0],
            v: [0.0, 0.0, 1.0],
            is_culled: None,
            material: material_fn("lambertian_cornell_box_white"),
        },
        prefix_builtin_key("cornell_box_far_wall") => GeometricData::PrimitiveParallelogram {
            lower_left: [0.0, 0.0, -1.0],
            u: [1.0, 0.0, 0.0],
            v: [0.0, 1.0, 0.0],
            is_culled: None,
            material: material_fn("lambertian_cornell_box_white"),
        },
        prefix_builtin_key("cornell_box_near_wall") => GeometricData::PrimitiveParallelogram {
            lower_left: [1.0, 0.0, 0.0],
            u: [-1.0, 0.0, 0.0],
            v: [0.0, 1.0, 0.0],
            is_culled: Some(true),
            material: material_fn("lambertian_cornell_box_white"),
        },
        prefix_builtin_key("cornell_box_ceiling_light") => GeometricData::PrimitiveParallelogram {
            lower_left: [0.35, 0.999, -0.65],
            u: [0.3, 0.0, 0.0],
            v: [0.0, 0.0, 0.3],
            is_culled: None,
            material: material_fn("lambertian_cornell_box_white_light"),
        },
        prefix_builtin_key("cornell_box_room") => GeometricData::CompoundList {
            use_bvh: Some(true),
            geometrics: vec![
                "cornell_box_left_wall",
                "cornell_box_right_wall",
                "cornell_box_floor",
                "cornell_box_ceiling",
                "cornell_box_ceiling_light",
                "cornell_box_far_wall",
                "cornell_box_near_wall",
            ].iter().map(|g| GeometricRefOrInline::Ref(prefix_builtin_key(g))).collect(),
        },
        prefix_builtin_key("cornell_box_far_left_box") => GeometricData::InstanceRotateYAxis {
            geometric: GeometricRefOrInline::Inline(Box::new(GeometricData::CompoundAxisAlignedPBox {
                a: [0.2, 0.0, -0.5],
                b: [0.5, 0.6, -0.8],
                is_culled:None,
                material: material_fn("lambertian_cornell_box_white"),
             })),
            angle: Angle::Degrees(15.0),
            around: Some([0.35, 0.0, -0.65]),
        },
        prefix_builtin_key("cornell_box_near_right_box") => GeometricData::InstanceRotateYAxis {
            geometric: GeometricRefOrInline::Inline(Box::new(GeometricData::CompoundAxisAlignedPBox {
                a: [0.5, 0.0, -0.2],
                b: [0.8, 0.3, -0.5],
                is_culled:None,
                material: material_fn("lambertian_cornell_box_white"),
            })),
            angle: Angle::Degrees(-18.0),
            around: Some([0.65, 0.0, -0.35]),
        },
    }
}

fn get_builtin_cameras() -> IndexMap<String, CameraData> {
    indexmap! {
        prefix_builtin_key("cornell_box") => CameraData {
            vertical_field_of_view_degrees:40.0,
            eye_location: [0.5, 0.5, 1.44144],
            target_location: [0.5,0.5,0.0],
            view_up: [0.0,1.0,0.0],
            defocus_angle_degrees: 0.0,
            focus_distance: FocusDistance::Type(FocusDistanceType::EyeToTarget),
        }
    }
}

fn get_builtin_scenes() -> IndexMap<String, SceneData> {
    indexmap! {
        prefix_builtin_key("cornell_box") => SceneData {
            geometrics: vec![
                "cornell_box_room",
                "cornell_box_far_left_box",
                "cornell_box_near_right_box",
            ].iter().map(|g| GeometricRefOrInline::Ref(prefix_builtin_key(g))).collect(),
            use_bvh: true,
            camera: CameraRefOrInline::Ref(prefix_builtin_key("cornell_box")),
            background_color: [0.0, 0.0, 0.0],
        }
    }
}
