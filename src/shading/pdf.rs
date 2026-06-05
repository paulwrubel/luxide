use std::sync::Arc;

use crate::geometry::{Geometric, Onb, Point, Vector};

/// A probability density function over solid angle (directions on the unit
/// sphere or hemisphere).
///
/// The two methods form a matched pair:
/// - `sample()` draws a random direction distributed according to this PDF.
/// - `density(dir)` returns the probability density that `sample()` would
///   have assigned to the given direction.
pub trait Pdf: std::fmt::Debug {
    /// Draw a random unit direction distributed according to this PDF.
    fn sample(&self) -> Vector;

    /// The solid-angle probability density at `direction`.
    fn density(&self, direction: Vector) -> f64;
}

/// Cosine-weighted probability density over the hemisphere centered on a
/// surface normal.
///
/// `density(dir)` returns `max(0, cos(θ)) / π`, where `cos(θ)` is the
/// dot product of the direction with the stored normal.
///
/// Internally uses [`Vector::random_cosine_weighted_direction`] and [`Onb`] to
/// generate directions (Malley's method: uniform disk sample projected
/// onto the hemisphere).
#[derive(Debug)]
pub struct CosineHemispherePdf {
    onb: Onb,
}

impl CosineHemispherePdf {
    /// Create a cosine-weighted PDF centered on `normal` (the surface normal).
    pub fn new(normal: Vector) -> Self {
        Self {
            onb: Onb::from_w(normal),
        }
    }
}

impl Pdf for CosineHemispherePdf {
    fn sample(&self) -> Vector {
        self.onb
            .to_world(Vector::random_cosine_weighted_direction())
    }

    fn density(&self, direction: Vector) -> f64 {
        let cos_theta = self.onb.w.dot(direction);
        if cos_theta <= 0.0 {
            0.0
        } else {
            cos_theta / std::f64::consts::PI
        }
    }
}

/// Uniform probability density over the hemisphere centered on a surface
/// normal.
///
/// `density(dir)` returns `1 / (2π)` if `dir` points above the hemisphere
/// (i.e., `dot(dir, normal) > 0`), and `0.0` otherwise.
#[derive(Debug)]
pub struct UniformHemispherePdf {
    onb: Onb,
}

impl UniformHemispherePdf {
    /// Create a uniform-hemisphere PDF centered on `normal` (the surface normal).
    pub fn new(normal: Vector) -> Self {
        Self {
            onb: Onb::from_w(normal),
        }
    }
}

impl Pdf for UniformHemispherePdf {
    fn sample(&self) -> Vector {
        let mut direction = Vector::random_unit();
        // map lower hemisphere to upper: negate the vector if z < 0.
        // this doubles the density on +Z (from 1/4π to 1/2π) while
        // preserving uniformity across the hemisphere.
        if direction.z < 0.0 {
            direction = -direction;
        }
        self.onb.to_world(direction)
    }

    fn density(&self, direction: Vector) -> f64 {
        if self.onb.w.dot(direction) <= 0.0 {
            0.0
        } else {
            1.0 / (2.0 * std::f64::consts::PI)
        }
    }
}

/// Uniform probability density over the full sphere.
///
/// `density(dir)` always returns `1 / (4π)`. Used for isotropic volume
/// scattering materials.
#[derive(Debug)]
pub struct UniformSpherePdf;

impl Pdf for UniformSpherePdf {
    fn sample(&self) -> Vector {
        Vector::random_unit()
    }

    fn density(&self, _dir: Vector) -> f64 {
        1.0 / (4.0 * std::f64::consts::PI)
    }
}

/// PDF that samples directions toward a piece of geometry (typically a light).
///
/// Stores the geometric object and the origin point so `sample()` and
/// `density()` can delegate to the object's `sample_direction_from` /
/// `direction_pdf` methods without needing an explicit origin parameter.
#[derive(Clone, Debug)]
pub struct GeometricPdf {
    geometric: Arc<dyn Geometric>,
    origin: Point,
}

impl GeometricPdf {
    pub fn new(geometric: Arc<dyn Geometric>, origin: Point) -> Self {
        Self { geometric, origin }
    }
}

impl Pdf for GeometricPdf {
    fn sample(&self) -> Vector {
        self.geometric.sample_direction_from(self.origin)
    }

    fn density(&self, direction: Vector) -> f64 {
        self.geometric.direction_pdf(self.origin, direction)
    }
}

// ---------------------------------------------------------------------------
// MixturePdf
// ---------------------------------------------------------------------------

/// Blends two PDFs with equal weight (50/50).
///
/// `sample()` flips a fair coin to choose which distribution to draw from.
/// `density()` returns the weighted average of both densities, regardless
/// of which one was used for sampling. This is correct because every
/// direction that either PDF could have generated contributes to the
/// denominator in the Monte Carlo estimator.
#[derive(Debug)]
pub struct MixturePdf {
    a: Box<dyn Pdf>,
    a_weight: f64,
    b: Box<dyn Pdf>,
    b_weight: f64,
}

impl MixturePdf {
    pub fn new(a: Box<dyn Pdf>, a_weight: f64, b: Box<dyn Pdf>, b_weight: f64) -> Self {
        let total = a_weight + b_weight;

        Self {
            a,
            a_weight: a_weight / total,
            b,
            b_weight: b_weight / total,
        }
    }

    pub fn new_equal(a: Box<dyn Pdf>, b: Box<dyn Pdf>) -> Self {
        Self::new(a, 0.5, b, 0.5)
    }
}

impl Pdf for MixturePdf {
    fn sample(&self) -> Vector {
        if rand::random::<f64>() < self.a_weight {
            self.a.sample()
        } else {
            self.b.sample()
        }
    }

    fn density(&self, direction: Vector) -> f64 {
        self.a_weight * self.a.density(direction) + self.b_weight * self.b.density(direction)
    }
}
