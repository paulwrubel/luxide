use std::{fs, sync::Arc};

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

#[derive(Deserialize)]
struct Render {
    parameters: Parameters,
    scene: String,
    scenes: IndexMap<String, SceneData>,
    cameras: IndexMap<String, CameraData>,
    textures: IndexMap<String, TextureData>,
    materials: IndexMap<String, MaterialData>,
    geometrics: IndexMap<String, GeometricData>,
}

#[derive(Deserialize)]
struct SceneData {
    geometrics: Vec<String>,
    use_bvh: bool,
    camera: String,
    background_color: [f64; 3],
}

#[derive(Deserialize)]
struct CameraData {
    vertical_field_of_view_degrees: f64,
    eye_location: [f64; 3],
    target_location: [f64; 3],
    view_up: [f64; 3],
    defocus_angle_degrees: f64,
    focus_distance: FocusDistance,
}

#[derive(Deserialize)]
#[serde(rename_all = "snake_case")]
enum FocusDistance {
    Exact(f64),
    EyeToTarget,
}

#[derive(Deserialize)]
#[serde(rename_all = "snake_case")]
enum TextureData {
    Checker {
        scale: f64,
        even_texture: String,
        odd_texture: String,
    },
    Image {
        filename: String,
        gamma: f64,
    },
    // #[serde(rename = "noise")]
    SolidColor([f64; 3]),
}

#[derive(Deserialize)]
#[serde(rename_all = "snake_case")]
enum MaterialData {
    Dielectric {
        reflectance_texture: String,
        emittance_texture: String,
        index_of_refraction: f64,
    },
    Lambertian {
        reflectance_texture: String,
        emittance_texture: String,
    },
    Specular {
        reflectance_texture: String,
        emittance_texture: String,
        roughness: f64,
    },
}

#[derive(Deserialize)]
enum GeometricData {
    #[serde(rename = "list")]
    CompoundList {
        use_bvh: Option<bool>,
        geometrics: Vec<String>,
    },
    #[serde(rename = "box")]
    CompoundAxisAlignedPBox {
        a: [f64; 3],
        b: [f64; 3],
        is_culled: Option<bool>,
        material: String,
    },
    #[serde(rename = "rotate_y")]
    InstanceRotateYAxis {
        geometric: String,
        angle: Angle,
        around: [f64; 3],
    },
    #[serde(rename = "translate")]
    InstanceTranslate {
        geometric: String,
        translation: [f64; 3],
    },
    #[serde(rename = "parallelogram")]
    PrimitiveParallelogram {
        lower_left: [f64; 3],
        u: [f64; 3],
        v: [f64; 3],
        is_culled: Option<bool>,
        material: String,
    },
    #[serde(rename = "sphere")]
    PrimitiveSphere {
        center: [f64; 3],
        radius: f64,
        material: String,
    },
    #[serde(rename = "constant_volume")]
    VolumeConstant {
        geometric: String,
        density: f64,
        reflectance_texture: String,
    },
}

pub fn parse_yaml(filename: &str) -> Result<(Parameters, Scene), String> {
    // get and parse file
    let unparsed = fs::read_to_string(filename).map_err(|err| err.to_string())?;
    let parsed: Render = serde_yaml::from_str(&unparsed).map_err(|err| err.to_string())?;

    // setup named properties
    let textures = build_textures(&parsed.textures)?;
    let materials = build_materials(&parsed.materials, &textures)?;
    let geometrics = build_geometrics(&parsed.geometrics, &textures, &materials)?;
    let cameras = build_cameras(&parsed.cameras)?;
    let mut scenes = build_scenes(&parsed.scenes, &geometrics, &cameras)?;

    let selected_scene = scenes.remove(&parsed.scene).ok_or(format!(
        "Scene {} not found. Is it specified in the scenes list?",
        parsed.scene
    ))?;

    // println!("{:#?}", selected_scene.world);

    Ok((parsed.parameters, selected_scene))
}

fn build_textures(
    texture_data: &IndexMap<String, TextureData>,
) -> Result<IndexMap<String, Arc<dyn Texture>>, String> {
    let mut textures: IndexMap<String, Arc<dyn Texture>> = IndexMap::new();
    for (name, texture) in texture_data {
        match texture {
            TextureData::Checker {
                scale,
                even_texture: even_texture_name,
                odd_texture: odd_texture_name,
            } => {
                let even = textures.get(even_texture_name).ok_or(format!(
                    "Texture {} not found. Is it specified *before* this one in the textures list?",
                    even_texture_name
                ))?;
                let odd = textures.get(even_texture_name).ok_or(format!(
                    "Texture {} not found. Is it specified *before* this one in the textures list?",
                    odd_texture_name
                ))?;
                textures.insert(
                    (*name).clone(),
                    Arc::new(Checker::new(*scale, Arc::clone(even), Arc::clone(odd))),
                );
            }
            TextureData::Image { filename, gamma } => {
                let image_texture = Image8Bit::from_filename(filename, *gamma)
                    .map_err(|err| (format!("Error loading image at \"{}\": {}", filename, err)))?;
                textures.insert((*name).clone(), Arc::new(image_texture));
            }
            TextureData::SolidColor(color) => {
                textures.insert(
                    (*name).clone(),
                    Arc::new(SolidColor::from_rgb(color[0], color[1], color[2])),
                );
            }
        }
    }
    Ok(textures)
}

fn build_materials(
    material_data: &IndexMap<String, MaterialData>,
    textures: &IndexMap<String, Arc<dyn Texture>>,
) -> Result<IndexMap<String, Arc<dyn Material>>, String> {
    let mut materials: IndexMap<String, Arc<dyn Material>> = IndexMap::new();
    for (name, material) in material_data {
        match material {
            MaterialData::Dielectric {
                reflectance_texture: reflectance_texture_name,
                emittance_texture: emittance_texture_name,
                index_of_refraction,
            } => {
                let reflectance_texture = textures.get(reflectance_texture_name).ok_or(format!(
                    "Texture {} not found. Is it specified in the textures list?",
                    reflectance_texture_name
                ))?;
                let emittance_texture = textures.get(emittance_texture_name).ok_or(format!(
                    "Texture {} not found. Is it specified in the textures list?",
                    emittance_texture_name
                ))?;
                materials.insert(
                    (*name).clone(),
                    Arc::new(Dielectric::new(
                        Arc::clone(reflectance_texture),
                        Arc::clone(&emittance_texture),
                        *index_of_refraction,
                    )),
                );
            }
            MaterialData::Lambertian {
                reflectance_texture: reflectance_texture_name,
                emittance_texture: emittance_texture_name,
            } => {
                let reflectance_texture = textures.get(reflectance_texture_name).ok_or(format!(
                    "Texture {} not found. Is it specified in the textures list?",
                    reflectance_texture_name
                ))?;
                let emittance_texture = textures.get(emittance_texture_name).ok_or(format!(
                    "Texture {} not found. Is it specified in the textures list?",
                    emittance_texture_name
                ))?;
                materials.insert(
                    (*name).clone(),
                    Arc::new(Lambertian::new(
                        Arc::clone(reflectance_texture),
                        Arc::clone(&emittance_texture),
                    )),
                );
            }
            MaterialData::Specular {
                reflectance_texture: reflectance_texture_name,
                emittance_texture: emittance_texture_name,
                roughness,
            } => {
                let reflectance_texture = textures.get(reflectance_texture_name).ok_or(format!(
                    "Texture {} not found. Is it specified in the textures list?",
                    reflectance_texture_name
                ))?;
                let emittance_texture = textures.get(emittance_texture_name).ok_or(format!(
                    "Texture {} not found. Is it specified in the textures list?",
                    emittance_texture_name
                ))?;
                materials.insert(
                    (*name).clone(),
                    Arc::new(Specular::new(
                        Arc::clone(reflectance_texture),
                        Arc::clone(&emittance_texture),
                        *roughness,
                    )),
                );
            }
        }
    }
    Ok(materials)
}

fn build_geometrics(
    geometric_data: &IndexMap<String, GeometricData>,
    textures: &IndexMap<String, Arc<dyn Texture>>,
    materials: &IndexMap<String, Arc<dyn Material>>,
) -> Result<IndexMap<String, Arc<dyn Geometric>>, String> {
    let mut geometrics: IndexMap<String, Arc<dyn Geometric>> = IndexMap::new();
    for (name, geometric) in geometric_data {
        println!("{:#?} when {}", geometrics.keys(), name);
        match geometric {
            GeometricData::CompoundAxisAlignedPBox {
                a,
                b,
                is_culled,
                material: material_name,
            } => {
                let material = materials.get(material_name).ok_or(format!(
                    "Material {} not found. Is it specified in the materials list?",
                    material_name
                ))?;
                geometrics.insert(
                    (*name).clone(),
                    Arc::new(AxisAlignedPBox::new(
                        (*a).into(),
                        (*b).into(),
                        (*is_culled).unwrap_or(false),
                        Arc::clone(material),
                    )),
                );
            }
            GeometricData::CompoundList {
                use_bvh,
                geometrics: geometric_names,
            } => {
                let mut list = List::new();
                for name in geometric_names {
                    let geometric = geometrics.get(name).ok_or(format!(
                        "Geometric {} not found. Is it specified in the geometrics list?",
                        name
                    ))?;
                    list.push(Arc::clone(geometric));
                }
                geometrics.insert(
                    (*name).clone(),
                    if use_bvh.unwrap_or(false) {
                        Arc::new(BVH::from_list(list))
                    } else {
                        Arc::new(list)
                    },
                );
            }
            GeometricData::InstanceRotateYAxis {
                geometric: geometric_name,
                angle,
                around,
            } => {
                let geometric = geometrics.get(geometric_name).ok_or(format!(
                    "Geometric {} not found. Is it specified in the geometrics list?",
                    geometric_name
                ))?;
                geometrics.insert(
                    (*name).clone(),
                    Arc::new(RotateYAxis::new(
                        Arc::clone(geometric),
                        *angle,
                        (*around).into(),
                    )),
                );
            }
            GeometricData::InstanceTranslate {
                geometric: geometric_name,
                translation,
            } => {
                let geometric = geometrics.get(geometric_name).ok_or(format!(
                    "Geometric {} not found. Is it specified in the geometrics list?",
                    geometric_name
                ))?;
                geometrics.insert(
                    (*name).clone(),
                    Arc::new(Translate::new(Arc::clone(geometric), (*translation).into())),
                );
            }
            GeometricData::PrimitiveParallelogram {
                lower_left,
                u,
                v,
                is_culled,
                material: material_name,
            } => {
                let material = materials.get(material_name).ok_or(format!(
                    "Material {} not found. Is it specified in the materials list?",
                    material_name
                ))?;
                geometrics.insert(
                    (*name).clone(),
                    Arc::new(Parallelogram::new(
                        (*lower_left).into(),
                        (*u).into(),
                        (*v).into(),
                        (*is_culled).unwrap_or(false),
                        Arc::clone(material),
                    )),
                );
            }
            GeometricData::PrimitiveSphere {
                center,
                radius,
                material: material_name,
            } => {
                let material = materials.get(material_name).ok_or(format!(
                    "Material {} not found. Is it specified in the materials list?",
                    material_name
                ))?;
                geometrics.insert(
                    (*name).clone(),
                    Arc::new(Sphere::new((*center).into(), *radius, Arc::clone(material))),
                );
            }
            GeometricData::VolumeConstant {
                geometric: geometric_name,
                density,
                reflectance_texture: reflectance_texture_name,
            } => {
                let geometric = geometrics.get(geometric_name).ok_or(format!(
                    "Geometric {} not found. Is it specified in the geometrics list?",
                    geometric_name
                ))?;
                let reflectance_texture = textures.get(reflectance_texture_name).ok_or(format!(
                    "Texture {} not found. Is it specified in the textures list?",
                    reflectance_texture_name
                ))?;
                geometrics.insert(
                    (*name).clone(),
                    Arc::new(volumes::Constant::new(
                        Arc::clone(geometric),
                        *density,
                        Arc::clone(reflectance_texture),
                    )),
                );
            }
        }
    }
    Ok(geometrics)
}

fn build_cameras(
    camera_data: &IndexMap<String, CameraData>,
) -> Result<IndexMap<String, Camera>, String> {
    let mut cameras: IndexMap<String, Camera> = IndexMap::new();
    for (name, camera_data) in camera_data {
        let eye_location: Point = camera_data.eye_location.into();
        let target_location: Point = camera_data.target_location.into();
        let camera = Camera::new(
            camera_data.vertical_field_of_view_degrees,
            eye_location,
            target_location,
            camera_data.view_up.into(),
            camera_data.defocus_angle_degrees,
            match camera_data.focus_distance {
                FocusDistance::Exact(distance) => distance,
                FocusDistance::EyeToTarget => eye_location.to(target_location).length(),
            },
        );
        cameras.insert((*name).clone(), camera);
    }
    Ok(cameras)
}

fn build_scenes(
    scene_data: &IndexMap<String, SceneData>,
    geometrics: &IndexMap<String, Arc<dyn Geometric>>,
    cameras: &IndexMap<String, Camera>,
) -> Result<IndexMap<String, Scene>, String> {
    let mut scenes: IndexMap<String, Scene> = IndexMap::new();
    for (name, scene_data) in scene_data {
        let mut world = List::new();
        for geometric_name in &scene_data.geometrics {
            let geometric = geometrics.get(geometric_name).ok_or(format!(
                "Geometric {} not found. Is it specified in the geometrics list?",
                geometric_name
            ))?;
            world.push(Arc::clone(geometric));
        }
        let camera = cameras.get(&scene_data.camera).ok_or(format!(
            "Camera {} not found. Is it specified in the cameras list?",
            &scene_data.camera
        ))?;
        let scene = Scene {
            name: (*name).clone(),
            world: if scene_data.use_bvh {
                Arc::new(BVH::from_list(world))
            } else {
                Arc::new(world)
            },
            camera: (*camera).clone(),
            background_color: scene_data.background_color.into(),
        };
        scenes.insert((*name).clone(), scene);
    }
    Ok(scenes)
}
