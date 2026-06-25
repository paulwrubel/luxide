use std::sync::Arc;

use crate::geometry::{Geometric, Onb, Point, Vector3};

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
    /// Draw a random unit direction and the index of the strategy that produced it.
    /// For non-Mixture variants, the index is always 0.
    pub fn sample(&self) -> (Vector3, usize) {
        match self {
            Pdf::CosineHemisphere(onb) => {
                (onb.to_world(Vector3::random_cosine_weighted_direction()), 0)
            }
            Pdf::UniformHemisphere(onb) => {
                let mut direction = Vector3::random_unit();
                if direction.z < 0.0 {
                    direction = -direction;
                }
                (onb.to_world(direction), 0)
            }
            Pdf::UniformSphere => (Vector3::random_unit(), 0),
            Pdf::Geometric { geometric, origin } => (geometric.sample_direction_from(*origin), 0),
            Pdf::Mixture { entries } => {
                let threshold: f64 = rand::random();
                let mut cumulative = 0.0;
                for (i, (pdf, _weight)) in entries.iter().enumerate() {
                    cumulative += entries[i].1; // pre-normalized weight
                    if threshold <= cumulative {
                        return (pdf.sample().0, i);
                    }
                }
                let last = entries.last().unwrap();
                (last.0.sample().0, entries.len() - 1)
            }
        }
    }

    /// The solid-angle probability density at `direction`.
    pub fn density(&self, direction: Vector3) -> f64 {
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

    /// The MIS power-heuristic weight for the strategy at `strategy_idx`.
    ///
    /// For Mixture: `p_idx² / Σ p_i²`, where `p_i = weight_i × density_i(direction)`.
    /// For all other variants: 1.0 (single strategy, no MIS needed).
    pub fn power_heuristic(&self, direction: Vector3, strategy_idx: usize) -> f64 {
        match self {
            Pdf::Mixture { entries } => {
                // un-normalized densities: p_i = weight_i × density_i(dir)
                let densities: Vec<f64> = entries
                    .iter()
                    .map(|(pdf, weight)| weight * pdf.density(direction))
                    .collect();
                let sum_sq: f64 = densities.iter().map(|d| d * d).sum();
                if sum_sq <= 0.0 {
                    return 0.0;
                }
                let p_chosen = densities[strategy_idx];
                (p_chosen * p_chosen) / sum_sq
            }
            _ => 1.0,
        }
    }

    /// The probability density of the specific strategy at `strategy_idx`
    /// generating `direction`: `weight × density(direction)`.
    ///
    /// For Mixture, this is the joint density `w_s × p_s(dir)`.
    /// For all other variants, this is just `density(dir)`.
    pub fn strategy_density(&self, direction: Vector3, strategy_idx: usize) -> f64 {
        match self {
            Pdf::Mixture { entries } => {
                let (pdf, weight) = &entries[strategy_idx];
                weight * pdf.density(direction)
            }
            _ => self.density(direction),
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
