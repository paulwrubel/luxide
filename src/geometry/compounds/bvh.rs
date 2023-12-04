use std::{cmp::Ordering, sync::Arc};

use crate::{
    geometry::{Geometric, Ray, RayHit, AABB},
    utils::Interval,
};

use super::List;

#[derive(Debug, Clone)]
enum BVHNode {
    Branch { left: Arc<BVH>, right: Arc<BVH> },
    Leaf(Arc<dyn Geometric>),
}

#[derive(Debug, Clone)]
pub struct BVH {
    tree: BVHNode,
    bounding_box: AABB,
}

impl BVH {
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
            0 => panic!("Cannot create BVH from empty list"),
            1 => BVHNode::Leaf(geometrics.pop().unwrap()),
            _ => {
                let right = Self::new(geometrics.drain(list_length / 2..).collect());
                let left = Self::new(geometrics);
                BVHNode::Branch {
                    left: Arc::new(left),
                    right: Arc::new(right),
                }
            }
        };

        let bounding_box = match node {
            BVHNode::Branch {
                ref left,
                ref right,
            } => AABB::from_aabbs(left.bounding_box(), right.bounding_box()),
            BVHNode::Leaf(ref leaf) => leaf.bounding_box(),
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

impl Geometric for BVH {
    fn intersect(&self, ray: Ray, ray_t: Interval) -> Option<RayHit> {
        if !self.bounding_box.hit(ray, ray_t) {
            return None;
        }

        match &self.tree {
            BVHNode::Branch { left, right } => {
                let left_intersection = left.intersect(ray, ray_t);
                let updated_ray_t = match left_intersection {
                    Some(ref rayhit) => Interval::new(ray_t.minimum, rayhit.t),
                    None => ray_t,
                };
                let right_intersection = right.intersect(ray, updated_ray_t);
                right_intersection.or(left_intersection)
            }
            BVHNode::Leaf(leaf) => leaf.intersect(ray, ray_t),
        }
    }

    fn bounding_box(&self) -> AABB {
        self.bounding_box
    }
}
