use crate::geometry::Ray;

use super::{Hit, RayHit};

pub struct List(Vec<Box<dyn Hit>>);

impl List {
    pub fn new() -> Self {
        Self(vec![])
    }

    pub fn from_vec(primitives: Vec<Box<dyn Hit>>) -> Self {
        Self(primitives)
    }

    pub fn push(&mut self, primitive: Box<dyn Hit>) {
        self.0.push(primitive);
    }

    pub fn clear(&mut self) {
        self.0.clear();
    }
}

impl Hit for List {
    fn hit(&self, ray: &Ray, t_min: f64, t_max: f64) -> Option<RayHit> {
        let mut closest_t_so_far = t_max;
        let mut closest_hit_record = None;
        for primitive in &self.0 {
            if let Some(hit_record) = primitive.hit(ray, t_min, closest_t_so_far) {
                closest_t_so_far = hit_record.t;
                closest_hit_record = Some(hit_record);
            }
        }
        closest_hit_record
    }
}
