use crate::{camera::Camera, geometry::Intersect};

pub struct Scene {
    pub world: Box<dyn Intersect>,
    pub camera: Camera,
}
