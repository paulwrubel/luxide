use std::sync::Arc;

use crate::{camera::Camera, geometry::Geometric, shading::Color};

#[derive(Clone)]
pub struct Scene {
    pub world: Arc<dyn Geometric>,
    pub camera: Camera,
    pub background_color: Color,
}
