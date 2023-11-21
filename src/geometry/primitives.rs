use crate::{Point, Ray, Vector};

mod list;
pub use list::List;

mod sphere;
pub use sphere::Sphere;

pub struct RayHit {
    pub t: f64,
    pub point: Point,
    pub normal: Vector,
}

pub trait Hit {
    fn hit(&self, ray: &Ray, t_min: f64, t_max: f64) -> Option<RayHit>;
}
