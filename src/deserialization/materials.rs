use std::sync::Arc;

use serde::{Deserialize, Serialize};

use crate::shading::materials::{Dielectric, Lambertian, Material, Specular};

use super::{Build, Builts, textures::TextureRefOrInline};

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case", untagged)]
pub enum MaterialRefOrInline {
    Ref(String),
    Inline(Box<MaterialData>),
}

impl Build<Arc<dyn Material>> for MaterialRefOrInline {
    fn build(&self, builts: &Builts) -> Result<Arc<dyn Material>, String> {
        match self {
            Self::Ref(name) => Ok(Arc::clone(builts.materials.get(name).ok_or(format!(
                "Material {} not found. Is it specified in the materials list?",
                name
            ))?)),
            Self::Inline(data) => data.build(builts),
        }
    }
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case", tag = "type", deny_unknown_fields)]
pub enum MaterialData {
    Dielectric {
        reflectance_texture: TextureRefOrInline,
        emittance_texture: TextureRefOrInline,
        index_of_refraction: f64,
    },
    Lambertian {
        reflectance_texture: TextureRefOrInline,
        emittance_texture: TextureRefOrInline,
    },
    Specular {
        reflectance_texture: TextureRefOrInline,
        emittance_texture: TextureRefOrInline,
        roughness: f64,
    },
}

impl Build<Arc<dyn Material>> for MaterialData {
    fn build(&self, builts: &Builts) -> Result<Arc<dyn Material>, String> {
        match self {
            Self::Dielectric {
                reflectance_texture,
                emittance_texture,
                index_of_refraction,
            } => {
                let reflectance_texture = reflectance_texture.build(builts)?;
                let emittance_texture = emittance_texture.build(builts)?;

                Ok(Arc::new(Dielectric::new(
                    reflectance_texture,
                    emittance_texture,
                    *index_of_refraction,
                )))
            }
            Self::Lambertian {
                reflectance_texture,
                emittance_texture,
            } => {
                let reflectance_texture = reflectance_texture.build(builts)?;
                let emittance_texture = emittance_texture.build(builts)?;

                Ok(Arc::new(Lambertian::new(
                    reflectance_texture,
                    emittance_texture,
                )))
            }
            Self::Specular {
                reflectance_texture,
                emittance_texture,
                roughness,
            } => {
                let reflectance_texture = reflectance_texture.build(builts)?;
                let emittance_texture = emittance_texture.build(builts)?;

                Ok(Arc::new(Specular::new(
                    reflectance_texture,
                    emittance_texture,
                    *roughness,
                )))
            }
        }
    }
}
