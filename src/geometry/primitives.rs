use std::rc::Rc;

use super::{Point, Ray, Vector};
use crate::{shading::materials::Scatter, utils::Interval};

mod list;
pub use list::List;

mod sphere;
pub use sphere::Sphere;

pub struct RayHit {
    pub t: f64,
    pub point: Point,
    pub normal: Vector,
    pub material: Rc<dyn Scatter>,
}

pub trait Hit {
    fn hit(&self, ray: &Ray, ray_t: Interval) -> Option<RayHit>;
}
