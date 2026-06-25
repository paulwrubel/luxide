use std::sync::Arc;

use crate::{
    geometry::{Aabb, Geometric, Point, Ray, RayHit, Vector3},
    utils::Interval,
};

#[derive(Clone, Debug)]
pub struct List {
    pub items: Vec<Arc<dyn Geometric>>,
    bounding_box: Aabb,
}

impl Default for List {
    fn default() -> Self {
        Self::new()
    }
}

impl List {
    pub fn new() -> Self {
        Self {
            items: vec![],
            bounding_box: Aabb::EMPTY,
        }
    }

    pub fn from_vec(geometrics: Vec<Arc<dyn Geometric>>) -> Self {
        let bounding_box = geometrics
            .iter()
            .map(|p| p.bounding_box())
            .reduce(|acc, bb| acc.expand(bb).pad(0.00001))
            .unwrap_or(Aabb::EMPTY);

        Self {
            items: geometrics,
            bounding_box,
        }
    }

    pub fn push(&mut self, geometric: Arc<dyn Geometric>) {
        self.bounding_box = self
            .bounding_box
            .expand(geometric.bounding_box())
            .pad(0.00001);
        self.items.push(geometric);
    }

    pub fn clear(&mut self) {
        self.bounding_box = Aabb::EMPTY;
        self.items.clear();
    }

    pub fn items(&self) -> &Vec<Arc<dyn Geometric>> {
        &self.items
    }

    // items but give ownership
    pub fn take_items(self) -> Vec<Arc<dyn Geometric>> {
        self.items
    }
}

impl From<Vec<Arc<dyn Geometric>>> for List {
    fn from(geometrics: Vec<Arc<dyn Geometric>>) -> Self {
        Self::from_vec(geometrics)
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

    fn surface_area(&self) -> f64 {
        self.items.iter().map(|item| item.surface_area()).sum()
    }

    fn is_emissive(&self) -> bool {
        self.items.iter().any(|item| item.is_emissive())
    }

    fn is_transmissive(&self) -> bool {
        self.items.iter().any(|item| item.is_transmissive())
    }

    fn is_specular(&self) -> bool {
        self.items.iter().any(|item| item.is_specular())
    }

    fn is_empty(&self) -> bool {
        self.items.is_empty()
    }

    fn bounding_box(&self) -> Aabb {
        self.bounding_box
    }

    fn sample_direction_from(&self, origin: Point) -> Vector3 {
        let total_area = self.surface_area();
        if total_area <= 0.0 {
            return Vector3::random_unit();
        }
        let mut threshold: f64 = rand::random::<f64>() * total_area;
        for item in &self.items {
            let area = item.surface_area();
            if threshold <= area {
                return item.sample_direction_from(origin);
            }
            threshold -= area;
        }
        // fallback (floating-point edge case)
        self.items.last().unwrap().sample_direction_from(origin)
    }

    fn direction_pdf(&self, origin: Point, dir: Vector3) -> f64 {
        let total_area = self.surface_area();
        if total_area <= 0.0 {
            return 0.0;
        }
        self.items
            .iter()
            .map(|item| (item.surface_area() / total_area) * item.direction_pdf(origin, dir))
            .sum()
    }
}
