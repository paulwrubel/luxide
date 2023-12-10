use std::ops::{Index, IndexMut};

use auto_ops::{impl_op_ex, impl_op_ex_commutative};

use crate::{
    geometry::{Point, Ray, Vector},
    utils::Interval,
};

#[derive(Debug, Copy, Clone, PartialEq)]
pub struct AABB {
    pub x_interval: Interval,
    pub y_interval: Interval,
    pub z_interval: Interval,
}

impl AABB {
    pub const EMPTY: Self = Self {
        x_interval: Interval::EMPTY,
        y_interval: Interval::EMPTY,
        z_interval: Interval::EMPTY,
    };

    pub fn new(x_interval: Interval, y_interval: Interval, z_interval: Interval) -> Self {
        Self {
            x_interval,
            y_interval,
            z_interval,
        }
    }

    pub fn from_points(points: &[Point]) -> Self {
        let min_point = Point::min_components_from_list(&points);
        let max_point = Point::max_components_from_list(&points);
        Self {
            x_interval: Interval::new(min_point.0.x, max_point.0.x),
            y_interval: Interval::new(min_point.0.y, max_point.0.y),
            z_interval: Interval::new(min_point.0.z, max_point.0.z),
        }
    }

    pub fn from_aabbs(a: AABB, b: AABB) -> Self {
        Self {
            x_interval: Interval::from_intervals(a.x_interval, b.x_interval),
            y_interval: Interval::from_intervals(a.y_interval, b.y_interval),
            z_interval: Interval::from_intervals(a.z_interval, b.z_interval),
        }
    }

    pub fn unit() -> Self {
        Self {
            x_interval: Interval::new(-0.5, 0.5),
            y_interval: Interval::new(-0.5, 0.5),
            z_interval: Interval::new(-0.5, 0.5),
        }
    }

    pub fn pad(self, delta: f64) -> Self {
        Self {
            x_interval: if self.x_interval.size() >= delta {
                self.x_interval
            } else {
                self.x_interval.expand(delta)
            },
            y_interval: if self.y_interval.size() >= delta {
                self.y_interval
            } else {
                self.y_interval.expand(delta)
            },
            z_interval: if self.z_interval.size() >= delta {
                self.z_interval
            } else {
                self.z_interval.expand(delta)
            },
        }
    }

    pub fn expand(self, other: Self) -> Self {
        Self::from_aabbs(self, other)
    }

    pub fn hit(&self, ray: Ray, ray_t: Interval) -> bool {
        let mut interval = ray_t.clone(); // trivial clone since Interval is Copy
        for axis in 0..3 {
            let inverse_direction_component = 1.0 / ray.direction[axis];
            let origin_component = ray.origin[axis];

            let mut t0 = (self[axis].minimum - origin_component) * inverse_direction_component;
            let mut t1 = (self[axis].maximum - origin_component) * inverse_direction_component;

            if inverse_direction_component < 0.0 {
                std::mem::swap(&mut t0, &mut t1);
            }

            if t0 > interval.minimum {
                interval.minimum = t0;
            }
            if t1 < interval.maximum {
                interval.maximum = t1;
            }

            if interval.maximum <= interval.minimum {
                return false;
            }
        }
        true
    }
}

impl Index<usize> for AABB {
    type Output = Interval;

    fn index(&self, index: usize) -> &Self::Output {
        match index {
            0 => &self.x_interval,
            1 => &self.y_interval,
            2 => &self.z_interval,
            _ => panic!("Index out of bounds"),
        }
    }
}

impl IndexMut<usize> for AABB {
    fn index_mut(&mut self, index: usize) -> &mut Self::Output {
        match index {
            0 => &mut self.x_interval,
            1 => &mut self.y_interval,
            2 => &mut self.z_interval,
            _ => panic!("Index out of bounds"),
        }
    }
}

impl_op_ex_commutative!(+ |a: &AABB, b: &Vector| -> AABB {
    AABB {
        x_interval: a.x_interval + b.x,
        y_interval: a.y_interval + b.y,
        z_interval: a.z_interval + b.z,
    }
});

impl_op_ex!(+= |a: &mut AABB, b: &Vector| {
    a.x_interval += b.x;
    a.y_interval += b.y;
    a.z_interval += b.z;
});

impl_op_ex!(-|a: &AABB, b: &Vector| -> AABB {
    AABB {
        x_interval: a.x_interval - b.x,
        y_interval: a.y_interval - b.y,
        z_interval: a.z_interval - b.z,
    }
});

impl_op_ex!(-= |a: &mut AABB, b: &Vector|  {
    a.x_interval -= b.x;
    a.y_interval -= b.y;
    a.z_interval -= b.z;
});
