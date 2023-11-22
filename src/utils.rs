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

    pub fn contains_including(&self, x: f64) -> bool {
        self.minimum <= x && x <= self.maximum
    }

    pub fn contains_excluding(&self, x: f64) -> bool {
        self.minimum < x && x < self.maximum
    }
}
