use std::sync::Arc;

use indexmap::IndexMap;
use serde::Deserialize;

use crate::shading::{
    materials::{Dielectric, Lambertian, Material, Specular},
    Texture,
};

use super::{Build, Builts};

#[derive(Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum MaterialData {
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

impl Build<Arc<dyn Material>> for MaterialData {
    fn build(&self, builts: &Builts) -> Result<Arc<dyn Material>, String> {
        match self {
            Self::Dielectric {
                reflectance_texture: reflectance_texture_name,
                emittance_texture: emittance_texture_name,
                index_of_refraction,
            } => {
                let reflectance_texture =
                    builts
                        .textures
                        .get(reflectance_texture_name)
                        .ok_or(format!(
                            "Texture {} not found. Is it specified in the textures list?",
                            reflectance_texture_name
                        ))?;
                let emittance_texture =
                    builts.textures.get(emittance_texture_name).ok_or(format!(
                        "Texture {} not found. Is it specified in the textures list?",
                        emittance_texture_name
                    ))?;

                Ok(Arc::new(Dielectric::new(
                    Arc::clone(reflectance_texture),
                    Arc::clone(&emittance_texture),
                    *index_of_refraction,
                )))
            }
            Self::Lambertian {
                reflectance_texture: reflectance_texture_name,
                emittance_texture: emittance_texture_name,
            } => {
                let reflectance_texture =
                    builts
                        .textures
                        .get(reflectance_texture_name)
                        .ok_or(format!(
                            "Texture {} not found. Is it specified in the textures list?",
                            reflectance_texture_name
                        ))?;
                let emittance_texture =
                    builts.textures.get(emittance_texture_name).ok_or(format!(
                        "Texture {} not found. Is it specified in the textures list?",
                        emittance_texture_name
                    ))?;

                Ok(Arc::new(Lambertian::new(
                    Arc::clone(reflectance_texture),
                    Arc::clone(&emittance_texture),
                )))
            }
            Self::Specular {
                reflectance_texture: reflectance_texture_name,
                emittance_texture: emittance_texture_name,
                roughness,
            } => {
                let reflectance_texture =
                    builts
                        .textures
                        .get(reflectance_texture_name)
                        .ok_or(format!(
                            "Texture {} not found. Is it specified in the textures list?",
                            reflectance_texture_name
                        ))?;
                let emittance_texture =
                    builts.textures.get(emittance_texture_name).ok_or(format!(
                        "Texture {} not found. Is it specified in the textures list?",
                        emittance_texture_name
                    ))?;

                Ok(Arc::new(Specular::new(
                    Arc::clone(reflectance_texture),
                    Arc::clone(&emittance_texture),
                    *roughness,
                )))
            }
        }
    }
}
