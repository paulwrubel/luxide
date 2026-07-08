use std::sync::Arc;

use serde::{Deserialize, Serialize};

use crate::shading::{
    ColorRgb, ColorSpectrum, Medium,
    materials::{Dielectric, Lambertian, Material, Specular},
};

use super::{Build, Builts, textures::TextureRefOrInline};

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case", untagged)]
pub enum MaterialRefOrInline {
    Ref(String),
    Inline(MaterialData),
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

/// Serializable representation of an interior medium.
#[derive(Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum MediumData {
    /// Transparent interior — no absorption or emission.
    Vacuum,
    /// Homogeneous absorbing and emitting medium.
    Homogeneous {
        attenuation_distance: f64,
        transmittance: [f64; 3],
        emittance: [f64; 3],
    },
}

impl From<MediumData> for Medium {
    fn from(data: MediumData) -> Self {
        match data {
            MediumData::Vacuum => Medium::Vacuum,
            MediumData::Homogeneous {
                attenuation_distance,
                transmittance,
                emittance,
            } => {
                let transmittance = ColorSpectrum::from(ColorRgb::from(transmittance));
                let emittance = ColorSpectrum::from(ColorRgb::from(emittance));
                Medium::Homogeneous {
                    attenuation_distance,
                    transmittance,
                    emittance,
                }
            }
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
        #[serde(skip_serializing_if = "Option::is_none")]
        medium_data: Option<MediumData>,
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
                medium_data,
            } => {
                let reflectance_texture = reflectance_texture.build(builts)?;
                let emittance_texture = emittance_texture.build(builts)?;

                if let Some(MediumData::Homogeneous {
                    attenuation_distance,
                    ..
                }) = medium_data
                    && *attenuation_distance <= 0.0
                {
                    return Err(format!(
                        "attenuation_distance must be positive, got {attenuation_distance}",
                    ));
                }

                let medium = medium_data.clone().map(Medium::from);

                Ok(Arc::new(Dielectric::new(
                    reflectance_texture,
                    emittance_texture,
                    *index_of_refraction,
                    medium,
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
