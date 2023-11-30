use auto_ops::{impl_op_ex, impl_op_ex_commutative};

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Interval {
    pub minimum: f64,
    pub maximum: f64,
}

impl Interval {
    pub const EMPTY: Self = Self {
        minimum: f64::INFINITY,
        maximum: f64::NEG_INFINITY,
    };

    pub const UNIVERSE: Self = Self {
        minimum: f64::NEG_INFINITY,
        maximum: f64::INFINITY,
    };

    pub fn new(minimum: f64, maximum: f64) -> Self {
        Self { minimum, maximum }
    }

    pub fn from_intervals(a: Self, b: Self) -> Self {
        Self {
            minimum: a.minimum.min(b.minimum),
            maximum: a.maximum.max(b.maximum),
        }
    }

    pub fn size(&self) -> f64 {
        self.maximum - self.minimum
    }

    pub fn expand(&self, delta: f64) -> Self {
        let padding = delta / 2.0;
        Self {
            minimum: self.minimum - padding,
            maximum: self.maximum + padding,
        }
    }

    // a.k.a. "inside". RTIOW calls this "contains"
    pub fn contains_including(&self, x: f64) -> bool {
        self.minimum <= x && x <= self.maximum
    }

    // a.k.a. "strictly inside". RTIOW calls this "surrounds"
    pub fn contains_excluding(&self, x: f64) -> bool {
        self.minimum < x && x < self.maximum
    }

    pub fn clamp(&self, x: f64) -> f64 {
        if x < self.minimum {
            self.minimum
        } else if x > self.maximum {
            self.maximum
        } else {
            x
        }
    }
}

impl_op_ex_commutative!(+ |a: &Interval, b: &f64| -> Interval {
    Interval {
        minimum: a.minimum + b,
        maximum: a.maximum + b,
    }
});

impl_op_ex!(+= |a: &mut Interval, b: &f64| {
    a.minimum += b;
    a.maximum += b;
});

impl_op_ex!(-|a: &Interval, b: &f64| -> Interval {
    Interval {
        minimum: a.minimum - b,
        maximum: a.maximum - b,
    }
});

impl_op_ex!(-= |a: &mut Interval, b: &f64|  {
    a.minimum -= b;
    a.maximum -= b;
});
