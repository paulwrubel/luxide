use std::sync::Arc;

use serde::{Deserialize, Serialize};

use crate::{
    shading::{
        ColorRgb, Texture,
        textures::{Checker, Image8Bit, SolidColor},
    },
    tracing::ResourceID,
};

use super::{Build, Builts};

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case", untagged)]
pub enum TextureRefOrInline {
    Ref(String),
    Inline(Box<TextureData>),
}

impl Build<Arc<dyn Texture>> for TextureRefOrInline {
    fn build(&self, builts: &Builts<'_>) -> Result<Arc<dyn Texture>, String> {
        match self {
            Self::Ref(name) => Ok(Arc::clone(builts.textures.get(name).ok_or(format!(
                "Texture {} not found. Is it specified in the textures list?",
                name
            ))?)),
            Self::Inline(data) => data.build(builts),
        }
    }
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case", tag = "type", deny_unknown_fields)]
pub enum TextureData {
    Checker {
        scale: f64,
        even_texture: TextureRefOrInline,
        odd_texture: TextureRefOrInline,
    },
    Image {
        resource_id: ResourceID,
        gamma: f64,
    },
    #[serde(rename = "color")]
    SolidColor {
        color: [f64; 3],
    },
}

impl Build<Arc<dyn Texture>> for TextureData {
    fn build(&self, builts: &Builts<'_>) -> Result<Arc<dyn Texture>, String> {
        match self {
            Self::Checker {
                scale,
                even_texture,
                odd_texture,
            } => {
                let even = even_texture.build(builts)?;
                let odd = odd_texture.build(builts)?;

                Ok(Arc::new(Checker::new(*scale, even, odd)))
            }
            Self::Image { resource_id, gamma } => {
                match builts.resources {
                    // validation mode — return a 1x1 placeholder, no DB fetch needed
                    None => Ok(Arc::new(Image8Bit::new(image::RgbaImage::from_pixel(
                        1,
                        1,
                        image::Rgba([255, 0, 255, 255]),
                    )))),
                    Some(resources) => {
                        let texture =
                            resources
                                .get(&(*resource_id, gamma.to_bits()))
                                .ok_or_else(|| {
                                    format!(
                                        "Resource {} with gamma {} not found in pre-loaded data",
                                        resource_id, gamma
                                    )
                                })?;
                        Ok(Arc::clone(texture) as Arc<dyn Texture>)
                    }
                }
            }
            Self::SolidColor { color } => Ok(Arc::new(SolidColor::from(ColorRgb::from(*color)))),
        }
    }
}
