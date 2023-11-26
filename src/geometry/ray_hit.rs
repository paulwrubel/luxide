use std::rc::Rc;

use crate::shading::materials::Scatter;

use super::{Point, Vector};

#[derive(Clone)]
pub struct RayHit {
    pub t: f64,
    pub point: Point,
    pub normal: Vector,
    pub material: Rc<dyn Scatter>,
}
