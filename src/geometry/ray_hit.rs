use std::sync::Arc;

use crate::shading::materials::Material;

use super::{Point, Vector};

#[derive(Clone)]
pub struct RayHit {
    pub t: f64,
    pub point: Point,
    pub normal: Vector,
    pub material: Arc<dyn Material>,
    pub u: f64,
    pub v: f64,
}
