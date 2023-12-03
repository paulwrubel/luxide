use std::{collections::HashMap, fs, sync::Arc};

use serde::Deserialize;

use crate::{
    camera::Camera,
    geometry::{
        compounds::{List, BVH},
        primitives::Sphere,
        Intersect,
    },
    parameters::Parameters,
    scene::Scene,
    shading::{
        materials::{Dielectric, Lambertian, Material, Specular},
        textures::{Checker, Image8Bit, SolidColor},
        Texture,
    },
};

#[derive(Deserialize)]
struct Render {
    parameters: Parameters,
    scene: String,
    scenes: HashMap<String, SceneData>,
    cameras: HashMap<String, CameraData>,
    textures: HashMap<String, TextureData>,
    materials: HashMap<String, MaterialData>,
    geometrics: HashMap<String, GeometricData>,
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
    focus_distance: f64,
}

#[derive(Deserialize)]
enum TextureData {
    #[serde(rename = "checker")]
    Checker {
        scale: f64,
        even_texture: String,
        odd_texture: String,
    },
    #[serde(rename = "image")]
    Image { filename: String, gamma: f64 },
    // #[serde(rename = "noise")]
    #[serde(rename = "solid_color")]
    SolidColor([f64; 3]),
}

#[derive(Deserialize)]
enum MaterialData {
    #[serde(rename = "dielectric")]
    Dielectric {
        reflectance_texture: String,
        emittance_texture: String,
        index_of_refraction: f64,
    },
    #[serde(rename = "lambertian")]
    Lambertian {
        reflectance_texture: String,
        emittance_texture: String,
    },
    #[serde(rename = "specular")]
    Specular {
        reflectance_texture: String,
        emittance_texture: String,
        fuzziness: f64,
    },
}

#[derive(Deserialize)]
enum GeometricData {
    #[serde(rename = "sphere")]
    Sphere {
        center: [f64; 3],
        radius: f64,
        material: String,
    },
}

pub fn parse_yaml(filename: &str) -> Result<(Parameters, Scene), String> {
    // get and parse file
    let unparsed = fs::read_to_string(filename).map_err(|err| err.to_string())?;
    let parsed: Render = serde_yaml::from_str(&unparsed).map_err(|err| err.to_string())?;

    // setup named properties
    let textures = build_textures(&parsed.textures)?;
    let materials = build_materials(&parsed.materials, &textures)?;
    let geometrics = build_geometrics(&parsed.geometrics, &materials)?;
    let cameras = build_cameras(&parsed.cameras)?;
    let mut scenes = build_scenes(&parsed.scenes, &geometrics, &cameras)?;

    let selected_scene = match scenes.remove(&parsed.scene) {
        Some(scene) => scene,
        None => {
            return Err(format!(
                "Scene {} not found. Is it specified in the scenes list?",
                parsed.scene
            ))
        }
    };

    Ok((parsed.parameters, selected_scene))
}

fn build_textures(
    texture_data: &HashMap<String, TextureData>,
) -> Result<HashMap<String, Arc<dyn Texture>>, String> {
    let mut textures: HashMap<String, Arc<dyn Texture>> = HashMap::new();
    for (name, texture) in texture_data {
        match texture {
            TextureData::Checker {
                scale,
                even_texture: even_texture_name,
                odd_texture: odd_texture_name,
            } => {
                let even = match textures.get(even_texture_name) {
                    Some(t) => t,
                    None => {
                        return Err(format!(
                            "Texture {} not found. Is it specified *before* this one in the textures list?",
                            even_texture_name
                        ))
                    }
                };
                let odd = match textures.get(odd_texture_name) {
                    Some(t) => t,
                    None => {
                        return Err(format!(
                            "Texture {} not found. Is it specified *before* this one in the textures list?",
                            odd_texture_name
                        ))
                    }
                };
                textures.insert(
                    (*name).clone(),
                    Arc::new(Checker::new(*scale, Arc::clone(even), Arc::clone(odd))),
                );
            }
            TextureData::Image { filename, gamma } => {
                let image_texture = match Image8Bit::from_filename(filename, *gamma) {
                    Ok(t) => t,
                    Err(err) => {
                        return Err(format!("Error loading image at \"{}\": {}", filename, err))
                    }
                };
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
    material_data: &HashMap<String, MaterialData>,
    textures: &HashMap<String, Arc<dyn Texture>>,
) -> Result<HashMap<String, Arc<dyn Material>>, String> {
    let mut materials: HashMap<String, Arc<dyn Material>> = HashMap::new();
    for (name, material) in material_data {
        match material {
            MaterialData::Dielectric {
                reflectance_texture: reflectance_texture_name,
                emittance_texture: emittance_texture_name,
                index_of_refraction,
            } => {
                let reflectance_texture = match textures.get(reflectance_texture_name) {
                    Some(texture) => texture,
                    None => {
                        return Err(format!(
                            "Texture {} not found. Is it specified in the textures list?",
                            reflectance_texture_name
                        ))
                    }
                };
                let emittance_texture = match textures.get(emittance_texture_name) {
                    Some(texture) => texture,
                    None => {
                        return Err(format!(
                            "Texture {} not found. Is it specified in the textures list?",
                            emittance_texture_name
                        ))
                    }
                };
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
                let reflectance_texture = match textures.get(reflectance_texture_name) {
                    Some(texture) => texture,
                    None => {
                        return Err(format!(
                            "Texture {} not found. Is it specified in the textures list?",
                            reflectance_texture_name
                        ))
                    }
                };
                let emittance_texture = match textures.get(emittance_texture_name) {
                    Some(texture) => texture,
                    None => {
                        return Err(format!(
                            "Texture {} not found. Is it specified in the textures list?",
                            emittance_texture_name
                        ))
                    }
                };
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
                fuzziness,
            } => {
                let reflectance_texture = match textures.get(reflectance_texture_name) {
                    Some(texture) => texture,
                    None => {
                        return Err(format!(
                            "Texture {} not found. Is it specified in the textures list?",
                            reflectance_texture_name
                        ))
                    }
                };
                let emittance_texture = match textures.get(emittance_texture_name) {
                    Some(texture) => texture,
                    None => {
                        return Err(format!(
                            "Texture {} not found. Is it specified in the textures list?",
                            emittance_texture_name
                        ))
                    }
                };
                materials.insert(
                    (*name).clone(),
                    Arc::new(Specular::new(
                        Arc::clone(reflectance_texture),
                        Arc::clone(&emittance_texture),
                        *fuzziness,
                    )),
                );
            }
        }
    }
    Ok(materials)
}

fn build_geometrics(
    geometric_data: &HashMap<String, GeometricData>,
    materials: &HashMap<String, Arc<dyn Material>>,
) -> Result<HashMap<String, Arc<dyn Intersect>>, String> {
    let mut geometrics: HashMap<String, Arc<dyn Intersect>> = HashMap::new();
    for (name, geometric) in geometric_data {
        match geometric {
            GeometricData::Sphere {
                center,
                radius,
                material: material_name,
            } => {
                let material = match materials.get(material_name) {
                    Some(m) => m,
                    None => {
                        return Err(format!(
                            "Material {} not found. Is it specified in the materials list?",
                            material_name
                        ))
                    }
                };
                geometrics.insert(
                    (*name).clone(),
                    Arc::new(Sphere::new((*center).into(), *radius, Arc::clone(material))),
                );
            }
        }
    }
    Ok(geometrics)
}

fn build_cameras(
    camera_data: &HashMap<String, CameraData>,
) -> Result<HashMap<String, Camera>, String> {
    let mut cameras: HashMap<String, Camera> = HashMap::new();
    for (name, camera_data) in camera_data {
        let camera = Camera::new(
            camera_data.vertical_field_of_view_degrees,
            camera_data.eye_location.into(),
            camera_data.target_location.into(),
            camera_data.view_up.into(),
            camera_data.defocus_angle_degrees,
            camera_data.focus_distance,
        );
        cameras.insert((*name).clone(), camera);
    }
    Ok(cameras)
}

fn build_scenes(
    scene_data: &HashMap<String, SceneData>,
    geometrics: &HashMap<String, Arc<dyn Intersect>>,
    cameras: &HashMap<String, Camera>,
) -> Result<HashMap<String, Scene>, String> {
    let mut scenes: HashMap<String, Scene> = HashMap::new();
    for (name, scene_data) in scene_data {
        let mut world = List::new();
        for geometric_name in &scene_data.geometrics {
            let geometric = match geometrics.get(geometric_name) {
                Some(g) => g,
                None => {
                    return Err(format!(
                        "Geometric {} not found. Is it specified in the geometrics list?",
                        geometric_name
                    ))
                }
            };
            world.push(Arc::clone(geometric));
        }
        let camera = match cameras.get(&scene_data.camera) {
            Some(c) => c,
            None => {
                return Err(format!(
                    "Camera {} not found. Is it specified in the cameras list?",
                    &scene_data.camera
                ))
            }
        };
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
