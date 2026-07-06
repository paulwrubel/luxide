#[derive(Clone, Copy, Debug)]
pub enum QuadraticRoots {
    None,
    One(f64),
    Two(f64, f64),
}

/// Returns 0, 1, or 2 real roots of ax² + bx + c = 0,
/// using a cancellation-safe formulation.
/// Roots are returned in ascending order in the first `usize` entries.
pub fn solve_quadratic(a: f64, b: f64, c: f64) -> QuadraticRoots {
    // linear case
    if a.abs() < 1e-12 {
        if b.abs() < 1e-12 {
            return QuadraticRoots::None;
        }
        return QuadraticRoots::One(-c / b);
    }

    let discriminant = b * b - 4.0 * a * c;

    if discriminant < 0.0 {
        return QuadraticRoots::None;
    }

    if discriminant == 0.0 {
        let root = -0.5 * b / a;
        return QuadraticRoots::One(root);
    }

    let sqrt_disc = discriminant.sqrt();

    // cancellation-safe computation of q
    let q = if b >= 0.0 {
        -0.5 * (b + sqrt_disc)
    } else {
        -0.5 * (b - sqrt_disc)
    };

    let t0 = q / a;
    let t1 = c / q;

    if t0 < t1 {
        QuadraticRoots::Two(t0, t1)
    } else {
        QuadraticRoots::Two(t1, t0)
    }
}

// iterator for for-loop ergonomics: `for u in solve_quadratic(a, b, c) { ... }`
pub struct QuadraticRootsIter {
    roots: QuadraticRoots,
    index: u8,
}

impl Iterator for QuadraticRootsIter {
    type Item = f64;

    fn next(&mut self) -> Option<f64> {
        match (&self.roots, self.index) {
            (QuadraticRoots::One(t), 0) => {
                self.index = 1;
                Some(*t)
            }
            (QuadraticRoots::Two(t0, _), 0) => {
                self.index = 1;
                Some(*t0)
            }
            (QuadraticRoots::Two(_, t1), 1) => {
                self.index = 2;
                Some(*t1)
            }
            _ => None,
        }
    }
}

impl IntoIterator for QuadraticRoots {
    type Item = f64;
    type IntoIter = QuadraticRootsIter;

    fn into_iter(self) -> QuadraticRootsIter {
        QuadraticRootsIter {
            roots: self,
            index: 0,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn two_distinct_real_roots() {
        let roots = solve_quadratic(1.0, 3.0, 2.0);
        assert!(matches!(roots, QuadraticRoots::Two(..)));
        if let QuadraticRoots::Two(t0, t1) = roots {
            assert!((t0 + 2.0).abs() < 1e-12);
            assert!((t1 + 1.0).abs() < 1e-12);
        }
    }

    #[test]
    fn one_double_root() {
        let roots = solve_quadratic(1.0, 2.0, 1.0);
        assert!(matches!(roots, QuadraticRoots::One(..)));
        if let QuadraticRoots::One(t0) = roots {
            assert!((t0 + 1.0).abs() < 1e-12);
        }
    }

    #[test]
    fn no_real_roots() {
        let roots = solve_quadratic(1.0, 0.0, 1.0);
        assert!(matches!(roots, QuadraticRoots::None));
    }

    #[test]
    fn linear_case() {
        let roots = solve_quadratic(0.0, 2.0, -4.0);
        assert!(matches!(roots, QuadraticRoots::One(..)));
        if let QuadraticRoots::One(t0) = roots {
            assert!((t0 - 2.0).abs() < 1e-12);
        }
    }

    #[test]
    fn cancellation_case() {
        let roots = solve_quadratic(1.0, 1_000_000.0, 1.0);
        assert!(matches!(roots, QuadraticRoots::Two(..)));
        if let QuadraticRoots::Two(t0, t1) = roots {
            // roots should be approximately -1e6 and approximately -1e-6
            assert!(t0 < -1e5 && t0 > -2e6);
            assert!(t1 < -1e-7 && t1 > -1e-5);
            // verify they satisfy the quadratic within reasonable tolerance
            let eval_at_t0 = 1.0 * t0 * t0 + 1_000_000.0 * t0 + 1.0;
            let eval_at_t1 = 1.0 * t1 * t1 + 1_000_000.0 * t1 + 1.0;
            assert!(eval_at_t0.abs() < 1e-6);
            assert!(eval_at_t1.abs() < 1e-6);
        }
    }

    #[test]
    fn discriminant_exactly_zero() {
        let roots = solve_quadratic(1.0, 2.0, 1.0);
        assert!(matches!(roots, QuadraticRoots::One(..)));
        if let QuadraticRoots::One(t0) = roots {
            assert!((t0 + 1.0).abs() < 1e-12);
        }
    }

    #[test]
    fn negative_discriminant() {
        let roots = solve_quadratic(1.0, 1.0, 2.0);
        assert!(matches!(roots, QuadraticRoots::None));
    }

    #[test]
    fn near_linear() {
        let roots = solve_quadratic(1e-13, 2.0, -4.0);
        assert!(matches!(roots, QuadraticRoots::One(..)));
        if let QuadraticRoots::One(t0) = roots {
            assert!((t0 - 2.0).abs() < 1e-10);
        }
    }

    #[test]
    fn near_constant() {
        let roots = solve_quadratic(1e-13, 1e-13, 5.0);
        assert!(matches!(roots, QuadraticRoots::None));
    }
}
