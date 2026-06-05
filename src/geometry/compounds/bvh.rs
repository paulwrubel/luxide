use std::{cmp::Ordering, sync::Arc};

use crate::{
    geometry::{Aabb, Geometric, Point, Ray, RayHit, Vector},
    utils::Interval,
};

use super::List;

#[derive(Clone, Debug)]
enum BvhNode {
    Branch { left: Arc<Bvh>, right: Arc<Bvh> },
    Leaf(Arc<dyn Geometric>),
    Empty,
}

#[derive(Clone, Debug)]
pub struct Bvh {
    tree: BvhNode,
    bounding_box: Aabb,
}

impl Bvh {
    pub fn new(mut geometrics: Vec<Arc<dyn Geometric>>) -> Self {
        fn box_compare(
            axis: usize,
        ) -> impl FnMut(&Arc<dyn Geometric>, &Arc<dyn Geometric>) -> Ordering {
            move |a, b| {
                let a_bbox = a.bounding_box();
                let b_bbox = b.bounding_box();

                let ac = a_bbox[axis].minimum + a_bbox[axis].maximum;
                let bc: f64 = b_bbox[axis].minimum + b_bbox[axis].maximum;
                ac.partial_cmp(&bc).unwrap()
            }
        }

        fn axis_range(geometrics: &Vec<Arc<dyn Geometric>>, axis: usize) -> f64 {
            let (min, max) = geometrics
                .iter()
                .fold((f64::MAX, f64::MIN), |(bmin, bmax), p| {
                    let bounding_box = p.bounding_box();
                    (
                        bmin.min(bounding_box[axis].minimum),
                        bmax.max(bounding_box[axis].maximum),
                    )
                });
            max - min
        }

        let mut axis_ranges: Vec<(usize, f64)> =
            (0..3).map(|a| (a, axis_range(&geometrics, a))).collect();

        axis_ranges.sort_unstable_by(|a, b| b.1.partial_cmp(&a.1).unwrap());

        let axis = axis_ranges[0].0;
        let comparison_closure = box_compare(axis);

        geometrics.sort_unstable_by(comparison_closure);

        let list_length = geometrics.len();
        let node = match list_length {
            0 => BvhNode::Empty,
            1 => BvhNode::Leaf(geometrics.pop().unwrap()),
            _ => {
                let right = Self::new(geometrics.drain(list_length / 2..).collect());
                let left = Self::new(geometrics);
                BvhNode::Branch {
                    left: Arc::new(left),
                    right: Arc::new(right),
                }
            }
        };

        let bounding_box = match node {
            BvhNode::Branch {
                ref left,
                ref right,
            } => Aabb::from_aabbs(left.bounding_box(), right.bounding_box()),
            BvhNode::Leaf(ref leaf) => leaf.bounding_box(),
            BvhNode::Empty => Aabb::EMPTY,
        };

        Self {
            tree: node,
            bounding_box,
        }
    }

    pub fn from_list(list: List) -> Self {
        Self::new(list.take_items())
    }
}

impl Geometric for Bvh {
    fn intersect(&self, ray: Ray, ray_t: Interval) -> Option<RayHit> {
        if matches!(&self.tree, BvhNode::Empty) || !self.bounding_box.hit(ray, ray_t) {
            return None;
        }

        match &self.tree {
            BvhNode::Branch { left, right } => {
                let left_intersection = left.intersect(ray, ray_t);
                let updated_ray_t = match left_intersection {
                    Some(ref rayhit) => Interval::new(ray_t.minimum, rayhit.t),
                    None => ray_t,
                };
                let right_intersection = right.intersect(ray, updated_ray_t);
                right_intersection.or(left_intersection)
            }
            BvhNode::Leaf(leaf) => leaf.intersect(ray, ray_t),
            BvhNode::Empty => unreachable!("handled in early return"),
        }
    }

    fn surface_area(&self) -> f64 {
        match &self.tree {
            BvhNode::Branch { left, right } => left.surface_area() + right.surface_area(),
            BvhNode::Leaf(item) => item.surface_area(),
            BvhNode::Empty => 0.0,
        }
    }

    fn is_emissive(&self) -> bool {
        match &self.tree {
            BvhNode::Branch { left, right } => left.is_emissive() || right.is_emissive(),
            BvhNode::Leaf(item) => item.is_emissive(),
            BvhNode::Empty => false,
        }
    }

    fn bounding_box(&self) -> Aabb {
        self.bounding_box
    }

    fn sample_direction_from(&self, origin: Point) -> Vector {
        match &self.tree {
            BvhNode::Branch { left, right } => {
                let left_area = left.surface_area();
                let right_area = right.surface_area();
                let total = left_area + right_area;
                if total <= 0.0 {
                    return Vector::random_unit();
                }
                if rand::random::<f64>() * total <= left_area {
                    left.sample_direction_from(origin)
                } else {
                    right.sample_direction_from(origin)
                }
            }
            BvhNode::Leaf(item) => item.sample_direction_from(origin),
            BvhNode::Empty => Vector::random_unit(),
        }
    }

    fn direction_pdf(&self, origin: Point, dir: Vector) -> f64 {
        match &self.tree {
            BvhNode::Branch { left, right } => {
                let total = left.surface_area() + right.surface_area();
                if total <= 0.0 {
                    return 0.0;
                }
                (left.surface_area() * left.direction_pdf(origin, dir)
                    + right.surface_area() * right.direction_pdf(origin, dir))
                    / total
            }
            BvhNode::Leaf(item) => item.direction_pdf(origin, dir),
            BvhNode::Empty => 0.0,
        }
    }
}
