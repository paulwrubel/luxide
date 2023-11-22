use crate::{geometry::Ray, utils::Interval};

use super::{Hit, RayHit};

pub struct List(Vec<Box<dyn Hit>>);

impl List {
    pub fn new() -> Self {
        Self(vec![])
    }

    pub fn from_vec(primitives: Vec<Box<dyn Hit>>) -> Self {
        Self(primitives)
    }
}

impl Hit for List {
    fn hit(&self, ray: &Ray, ray_t: Interval) -> Option<RayHit> {
        let mut closest_t_so_far = ray_t.maximum;
        let mut closest_hit_record = None;
        for primitive in &self.0 {
            if let Some(hit_record) =
                primitive.hit(ray, Interval::new(ray_t.minimum, closest_t_so_far))
            {
                closest_t_so_far = hit_record.t;
                closest_hit_record = Some(hit_record);
            }
        }
        closest_hit_record
    }
}
