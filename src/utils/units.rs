use std::f64::consts::PI;

use serde::{Deserialize, Serialize};

#[derive(Debug, Copy, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Angle {
    Degrees(f64),
    Radians(f64),
}

impl Angle {
    pub fn value(&self) -> f64 {
        match self {
            Angle::Degrees(d) => *d,
            Angle::Radians(r) => *r,
        }
    }

    pub fn as_radians(&self) -> f64 {
        match self {
            Angle::Degrees(d) => *d * (PI / 180.0),
            Angle::Radians(r) => *r,
        }
    }

    pub fn as_degrees(&self) -> f64 {
        match self {
            Angle::Degrees(d) => *d,
            Angle::Radians(r) => *r * (180.0 / PI),
        }
    }
}
