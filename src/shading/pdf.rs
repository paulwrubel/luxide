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

/// Blends any number of PDFs with configurable weights.
///
/// `sample()` picks an entry by its normalized weight (CDF),
/// then delegates to that PDF.
/// `density()` returns the weighted sum of all densities, regardless
/// of which entry was used for sampling — each direction that any
/// constituent PDF could have generated contributes to the denominator.
#[derive(Debug)]
pub struct MixturePdf {
    entries: Vec<(Box<dyn Pdf>, f64)>,
}

impl MixturePdf {
    /// Build a mixture from weighted entries. Weights are normalized
    /// internally — raw values are fine.
    pub fn new(entries: Vec<(Box<dyn Pdf>, f64)>) -> Self {
        assert!(
            !entries.is_empty(),
            "MixturePdf requires at least one entry"
        );
        let total: f64 = entries.iter().map(|(_, w)| w).sum();
        let entries = entries
            .into_iter()
            .map(|(pdf, w)| (pdf, w / total))
            .collect();
        Self { entries }
    }
}

impl Pdf for MixturePdf {
    fn sample(&self) -> Vector {
        let threshold: f64 = rand::random();
        let mut cumulative = 0.0;
        for (pdf, weight) in &self.entries {
            cumulative += weight;
            if threshold <= cumulative {
                return pdf.sample();
            }
        }
        // floating-point fallback
        self.entries.last().unwrap().0.sample()
    }

    fn density(&self, direction: Vector) -> f64 {
        self.entries
            .iter()
            .map(|(pdf, weight)| weight * pdf.density(direction))
            .sum()
    }
}
