use crate::{camera::Camera, geometry::Intersect, shading::Color};

pub struct Scene {
    pub world: Box<dyn Intersect>,
    pub camera: Camera,
    pub background_color: Color,
}
