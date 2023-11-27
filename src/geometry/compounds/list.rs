use crate::{
    geometry::{primitives::AABB, Intersect, Ray, RayHit},
    utils::Interval,
};

pub struct List {
    pub list: Vec<Box<dyn Intersect>>,
    bounding_box: AABB,
}

impl List {
    pub fn new() -> Self {
        Self {
            list: vec![],
            bounding_box: AABB::EMPTY,
        }
    }

    pub fn from_vec(primitives: Vec<Box<dyn Intersect>>) -> Self {
        let bounding_box = primitives
            .iter()
            .map(|p| p.bounding_box())
            .reduce(|acc, bb| acc.expand(&bb))
            .unwrap_or(AABB::EMPTY);

        Self {
            list: primitives,
            bounding_box: bounding_box,
        }
    }

    pub fn push(&mut self, primitive: Box<dyn Intersect>) {
        self.list.push(primitive);
    }

    pub fn clear(&mut self) {
        self.list.clear();
    }

    pub fn items(&self) -> &Vec<Box<dyn Intersect>> {
        &self.list
    }

    // all but give ownership
    pub fn take_items(self) -> Vec<Box<dyn Intersect>> {
        self.list
    }

    pub fn len(&self) -> usize {
        self.list.len()
    }

    pub fn is_empty(&self) -> bool {
        self.list.is_empty()
    }
}

impl Intersect for List {
    fn intersect(&self, ray: Ray, ray_t: Interval) -> Option<RayHit> {
        let mut closest_t_so_far = ray_t.maximum;
        let mut closest_hit_record = None;
        for primitive in &self.list {
            if let Some(hit_record) =
                primitive.intersect(ray, Interval::new(ray_t.minimum, closest_t_so_far))
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
