use std::sync::Arc;

use indexmap::IndexMap;
use serde::Deserialize;

use crate::shading::{
    textures::{Checker, Image8Bit, SolidColor},
    Texture,
};

use super::{Build, Builts};

#[derive(Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TextureData {
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

impl Build<Arc<dyn Texture>> for TextureData {
    fn build(&self, builts: &Builts) -> Result<Arc<dyn Texture>, String> {
        match self {
            Self::Checker {
                scale,
                even_texture: even_texture_name,
                odd_texture: odd_texture_name,
            } => {
                let even = builts.textures.get(even_texture_name).ok_or(format!(
                    "Texture {} not found. Is it specified *before* this one in the textures list?",
                    even_texture_name
                ))?;
                let odd = builts.textures.get(even_texture_name).ok_or(format!(
                    "Texture {} not found. Is it specified *before* this one in the textures list?",
                    odd_texture_name
                ))?;

                Ok(Arc::new(Checker::new(
                    *scale,
                    Arc::clone(even),
                    Arc::clone(odd),
                )))
            }
            Self::Image { filename, gamma } => {
                let image_texture = Image8Bit::from_filename(filename, *gamma)
                    .map_err(|err| (format!("Error loading image at \"{}\": {}", filename, err)))?;

                Ok(Arc::new(image_texture))
            }
            Self::SolidColor(color) => {
                Ok(Arc::new(SolidColor::from_rgb(color[0], color[1], color[2])))
            }
        }
    }
}
