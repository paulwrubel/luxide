use std::sync::Arc;

use crate::{camera::Camera, geometry::Intersect, shading::Color};

pub struct Scene {
    pub name: String,
    pub world: Arc<dyn Intersect>,
    pub camera: Camera,
    pub background_color: Color,
}
