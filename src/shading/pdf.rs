use crate::geometry::{Onb, Vector};

/// A probability density function over solid angle (directions on the unit
/// sphere or hemisphere).
///
/// The two methods form a matched pair:
/// - `sample()` draws a random direction distributed according to this PDF.
/// - `density(dir)` returns the probability density that `sample()` would
///   have assigned to the given direction.
pub trait Pdf {
    /// Draw a random unit direction distributed according to this PDF.
    fn sample(&self) -> Vector;

    /// The solid-angle probability density at `dir`.
    fn density(&self, dir: Vector) -> f64;
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

    fn density(&self, dir: Vector) -> f64 {
        let cos_theta = self.onb.w.dot(dir);
        if cos_theta <= 0.0 {
            0.0
        } else {
            cos_theta / std::f64::consts::PI
        }
    }
}

/// Uniform probability density over the full sphere.
///
/// `density(dir)` always returns `1 / (4π)`. Used for isotropic volume
/// scattering materials.
pub struct UniformSpherePdf;

impl Pdf for UniformSpherePdf {
    fn sample(&self) -> Vector {
        Vector::random_unit()
    }

    fn density(&self, _dir: Vector) -> f64 {
        1.0 / (4.0 * std::f64::consts::PI)
    }
}
