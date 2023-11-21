use crate::{Point, Ray, Vector};

pub struct HitRecord {
    pub t: f64,
    pub point: Point,
    pub normal: Vector,
}

pub trait Hit {
    fn hit(&self, ray: &Ray, t_min: f64, t_max: f64) -> Option<HitRecord>;
}

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
    fn hit(&self, ray: &Ray, t_min: f64, t_max: f64) -> Option<HitRecord> {
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

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Sphere {
    center: Point,
    radius: f64,
}

impl Sphere {
    pub fn new(center: Point, radius: f64) -> Self {
        Self { center, radius }
    }

    pub fn center(&self) -> Point {
        self.center
    }

    pub fn radius(&self) -> f64 {
        self.radius
    }
}

impl Hit for Sphere {
    fn hit(&self, ray: &Ray, t_min: f64, t_max: f64) -> Option<HitRecord> {
        let oc = ray.origin() - self.center;

        let a = ray.direction().dot(&ray.direction());
        let b = oc.dot(&ray.direction());
        let c = oc.dot(&oc) - self.radius * self.radius;
        let discriminant = b * b - a * c;

        if discriminant > 0.0 {
            let t = (-b - discriminant.sqrt()) / a;
            if t < t_max && t > t_min {
                return Some(HitRecord {
                    t,
                    point: ray.point_at(t),
                    normal: (ray.point_at(t) - self.center) / self.radius,
                });
            }
            let t = (-b + discriminant.sqrt()) / a;
            if t < t_max && t > t_min {
                return Some(HitRecord {
                    t,
                    point: ray.point_at(t),
                    normal: (ray.point_at(t) - self.center) / self.radius,
                });
            }
        }
        None
    }
}
