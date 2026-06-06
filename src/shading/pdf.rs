use std::sync::Arc;

use crate::geometry::{Geometric, Onb, Point, Vector};

/// A probability density function over solid angle.
#[derive(Debug, Clone)]
pub enum Pdf {
    /// Cosine-weighted hemisphere, centered on a surface normal.
    /// `density(dir) = max(0, cos(θ)) / π`.
    CosineHemisphere(Onb),

    /// Uniform over the hemisphere, centered on a surface normal.
    /// `density(dir) = 1 / (2π)` when above the hemisphere, 0 otherwise.
    UniformHemisphere(Onb),

    /// Uniform over the full sphere.
    /// `density(dir) = 1 / (4π)`.
    UniformSphere,

    /// Samples directions toward a geometric object (typically a light).
    Geometric {
        geometric: Arc<dyn Geometric>,
        origin: Point,
    },

    /// Blends any number of weighted PDFs. `sample()` picks by CDF,
    /// `density()` returns the weighted sum.
    Mixture { entries: Vec<(Pdf, f64)> },
}

impl Pdf {
    /// Draw a random unit direction distributed according to this PDF.
    pub fn sample(&self) -> Vector {
        match self {
            Pdf::CosineHemisphere(onb) => onb.to_world(Vector::random_cosine_weighted_direction()),
            Pdf::UniformHemisphere(onb) => {
                let mut direction = Vector::random_unit();
                if direction.z < 0.0 {
                    direction = -direction;
                }
                onb.to_world(direction)
            }
            Pdf::UniformSphere => Vector::random_unit(),
            Pdf::Geometric { geometric, origin } => geometric.sample_direction_from(*origin),
            Pdf::Mixture { entries } => {
                let threshold: f64 = rand::random();
                let mut cumulative = 0.0;
                for (pdf, weight) in entries {
                    cumulative += weight;
                    if threshold <= cumulative {
                        return pdf.sample();
                    }
                }
                // floating-point fallback
                entries.last().unwrap().0.sample()
            }
        }
    }

    /// The solid-angle probability density at `direction`.
    pub fn density(&self, direction: Vector) -> f64 {
        match self {
            Pdf::CosineHemisphere(onb) => {
                let cos_theta = onb.w.dot(direction);
                if cos_theta <= 0.0 {
                    0.0
                } else {
                    cos_theta / std::f64::consts::PI
                }
            }
            Pdf::UniformHemisphere(onb) => {
                if onb.w.dot(direction) <= 0.0 {
                    0.0
                } else {
                    1.0 / (2.0 * std::f64::consts::PI)
                }
            }
            Pdf::UniformSphere => 1.0 / (4.0 * std::f64::consts::PI),
            Pdf::Geometric { geometric, origin } => geometric.direction_pdf(*origin, direction),
            Pdf::Mixture { entries } => entries
                .iter()
                .map(|(pdf, weight)| weight * pdf.density(direction))
                .sum(),
        }
    }

    /// Build a mixture from weighted entries. Weights are normalized internally.
    pub fn mixture(entries: Vec<(Pdf, f64)>) -> Self {
        assert!(!entries.is_empty(), "Mixture requires at least one entry");
        let total: f64 = entries.iter().map(|(_, w)| w).sum();
        let entries = entries
            .into_iter()
            .map(|(pdf, w)| (pdf, w / total))
            .collect();
        Pdf::Mixture { entries }
    }
}
