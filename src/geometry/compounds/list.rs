use std::sync::Arc;

use crate::{
    geometry::{Geometric, Ray, RayHit, AABB},
    utils::Interval,
};

#[derive(Debug, Clone)]
pub struct List {
    pub items: Vec<Arc<dyn Geometric>>,
    bounding_box: AABB,
}

impl List {
    pub fn new() -> Self {
        Self {
            items: vec![],
            bounding_box: AABB::EMPTY,
        }
    }

    pub fn from_vec(geometrics: Vec<Arc<dyn Geometric>>) -> Self {
        let bounding_box = geometrics
            .iter()
            .map(|p| p.bounding_box())
            .reduce(|acc, bb| acc.expand(bb))
            .unwrap_or(AABB::EMPTY);

        Self {
            items: geometrics,
            bounding_box: bounding_box,
        }
    }

    pub fn push(&mut self, geometric: Arc<dyn Geometric>) {
        self.bounding_box = self.bounding_box.expand(geometric.bounding_box());
        self.items.push(geometric);
    }

    pub fn push_all(&mut self, geometrics: &mut Vec<Arc<dyn Geometric>>) {
        self.items.append(geometrics)
    }

    pub fn clear(&mut self) {
        self.bounding_box = AABB::EMPTY;
        self.items.clear();
    }

    pub fn items(&self) -> &Vec<Arc<dyn Geometric>> {
        &self.items
    }

    // items but give ownership
    pub fn take_items(self) -> Vec<Arc<dyn Geometric>> {
        self.items
    }

    pub fn len(&self) -> usize {
        self.items.len()
    }

    pub fn is_empty(&self) -> bool {
        self.items.is_empty()
    }
}

impl Geometric for List {
    fn intersect(&self, ray: Ray, ray_t: Interval) -> Option<RayHit> {
        let mut closest_t_so_far = ray_t.maximum;
        let mut closest_hit_record = None;
        for geometric in &self.items {
            if let Some(hit_record) =
                geometric.intersect(ray, Interval::new(ray_t.minimum, closest_t_so_far))
            {
                closest_t_so_far = hit_record.t;
                closest_hit_record = Some(hit_record);
            }
        }
        closest_hit_record
    }

    fn bounding_box(&self) -> AABB {
        self.bounding_box
    }
}
