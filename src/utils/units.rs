use std::f64::consts::PI;

pub struct Degrees(pub f64);

impl Degrees {
    pub fn as_radians(&self) -> f64 {
        self.0 * (PI / 180.0)
    }
}

pub struct Radians(f64);

impl Radians {
    pub fn as_degrees(&self) -> f64 {
        self.0 * (180.0 / PI)
    }
}
