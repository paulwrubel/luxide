use std::sync::Arc;

use serde::Deserialize;

use crate::shading::{
    textures::{Checker, Image8Bit, SolidColor},
    Texture,
};

use super::{Build, Builts};

#[derive(Deserialize)]
#[serde(rename_all = "snake_case")]
#[serde(untagged)]
pub enum TextureRefOrInline {
    Ref(String),
    Inline(Box<TextureData>),
}

impl Build<Arc<dyn Texture>> for TextureRefOrInline {
    fn build(&self, builts: &Builts) -> Result<Arc<dyn Texture>, String> {
        match self {
            Self::Ref(name) => Ok(Arc::clone(builts.textures.get(name).ok_or(format!(
                "Texture {} not found. Is it specified in the textures list?",
                name
            ))?)),
            Self::Inline(data) => data.build(builts),
        }
    }
}

#[derive(Deserialize)]
#[serde(rename_all = "snake_case")]
#[serde(tag = "type")]
pub enum TextureData {
    Checker {
        scale: f64,
        even_texture: TextureRefOrInline,
        odd_texture: TextureRefOrInline,
    },
    Image {
        filename: String,
        gamma: f64,
    },
    #[serde(rename = "color")]
    SolidColor {
        color: [f64; 3],
    },
}

impl Build<Arc<dyn Texture>> for TextureData {
    fn build(&self, builts: &Builts) -> Result<Arc<dyn Texture>, String> {
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
            Self::Image { filename, gamma } => {
                let image_texture = Image8Bit::from_filename(filename, *gamma)
                    .map_err(|err| (format!("Error loading image at \"{}\": {}", filename, err)))?;

                Ok(Arc::new(image_texture))
            }
            Self::SolidColor { color } => {
                Ok(Arc::new(SolidColor::from_rgb(color[0], color[1], color[2])))
            }
        }
    }
}
