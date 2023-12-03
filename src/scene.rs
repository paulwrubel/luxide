use std::sync::Arc;

use crate::{camera::Camera, geometry::Geometric, shading::Color};

pub struct Scene {
    pub name: String,
    pub world: Arc<dyn Geometric>,
    pub camera: Camera,
    pub background_color: Color,
}
