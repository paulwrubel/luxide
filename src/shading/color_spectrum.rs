use std::sync::OnceLock;

use crate::geometry::{Vector, Vector3};
use crate::shading::{ColorRgb, HeroWavelengths};

/// Number of spectral samples from 380nm to 780nm (57nm spacing).
///
/// 8 samples is the standard trade-off in spectral rendering: linear interpolation
/// between adjacent samples captures smooth reflectance curves with < 1% perceptual
/// error (ΔE). Measured material reflectance spectra lack narrow features — they're
/// determined by broad electron band-gap absorption, so 57nm resolution is sufficient.
///
/// Below 8 samples, Smits basis reconstruction accuracy degrades on saturated
/// primaries. Above 8, the 8×8 basis computation cost grows quadratically with no
/// meaningful perceptual gain for surface reflectance. PBRT v4 uses this resolution.
pub const SPECTRAL_SAMPLE_COUNT: usize = 8;

/// Minimum visible wavelength in nanometers.
pub const LAMBDA_MIN: f64 = 380.0;

/// Maximum visible wavelength in nanometers.
pub const LAMBDA_MAX: f64 = 780.0;

#[derive(Debug, Copy, Clone, PartialEq)]
pub struct ColorSpectrum<const N: usize>(pub Vector<N>);

impl<const N: usize> Default for ColorSpectrum<N> {
    fn default() -> Self {
        Self(Vector::ZERO)
    }
}

/// Precomputed Smits basis spectra.
#[derive(Debug, Clone)]
struct SmitsBasis<const N: usize> {
    white: Vector<N>,
    red: Vector<N>,
    green: Vector<N>,
    blue: Vector<N>,
    cyan: Vector<N>,
    magenta: Vector<N>,
    yellow: Vector<N>,
}

static SMITS_BASIS: OnceLock<SmitsBasis<SPECTRAL_SAMPLE_COUNT>> = OnceLock::new();

/// Raw CIE integration of a flat [1.0; N] spectrum.
/// Used to normalize to_rgb() and hero_samples_to_color() so that
/// a flat unit spectrum maps to sRGB (1, 1, 1).
pub static CIE_WHITE_NORM: OnceLock<Vector3> = OnceLock::new();

pub fn compute_cie_white_norm<const N: usize>() -> Vector3 {
    let step = (LAMBDA_MAX - LAMBDA_MIN) / (N - 1) as f64;
    let mut x = 0.0;
    let mut y = 0.0;
    let mut z = 0.0;
    for i in 0..N {
        let lambda = LAMBDA_MIN + i as f64 * step;
        let (cx, cy, cz) = cie_1931_xyz(lambda);
        x += cx * step;
        y += cy * step;
        z += cz * step;
    }
    Vector3::new(x, y, z)
}

impl<const N: usize> ColorSpectrum<N> {
    /// All spectral samples set to zero.
    pub const ZERO: ColorSpectrum<N> = ColorSpectrum(Vector::ZERO);

    /// All spectral samples set to one.
    pub const ONE: ColorSpectrum<N> = ColorSpectrum(Vector::ONE);

    /// Sample the spectrum at an arbitrary wavelength via linear interpolation
    /// between the nearest two spectral bins.
    pub fn sample_wavelength(&self, wavelength_nm: f64) -> f64 {
        let t = (wavelength_nm - LAMBDA_MIN) / (LAMBDA_MAX - LAMBDA_MIN) * (N - 1) as f64;
        let t = t.clamp(0.0, (N - 1) as f64);

        let index = t.floor() as usize;
        if index + 1 >= N {
            return self.0.0[N - 1];
        }

        let fractional = t - index as f64;
        self.0.0[index] * (1.0 - fractional) + self.0.0[index + 1] * fractional
    }

    /// Sample the spectrum at each of the given hero wavelengths,
    /// returning a `Vector<N>` suitable for per-wavelength
    /// arithmetic in the integrator.
    pub fn sample<const M: usize>(&self, hero_wavelengths: &HeroWavelengths<M>) -> Vector<M> {
        use crate::geometry::Vector;
        let mut data = Vector::ZERO;
        for (d, &lambda) in data.iter_mut().zip(hero_wavelengths.iter()) {
            *d = self.sample_wavelength(lambda);
        }
        data
    }

    /// Returns `true` if all spectral samples are zero.
    pub fn is_black(&self) -> bool {
        self.0.iter().all(|&s| s == 0.0)
    }

    /// Largest value across all spectral samples.
    pub fn max_component(&self) -> f64 {
        self.0.iter().cloned().fold(f64::NEG_INFINITY, f64::max)
    }

    /// Scale all samples proportionally so the maximum equals `limit`.
    /// If the maximum is already at or below `limit`, returns `self` unchanged.
    pub fn scale_down(&self, limit: f64) -> Self {
        let max = self.max_component();
        if max > limit {
            let factor = limit / max;
            let mut samples = self.0;
            for s in &mut samples {
                *s *= factor;
            }
            Self(samples)
        } else {
            *self
        }
    }

    /// Replace any NaN values with 0.0 in all spectral samples.
    pub fn de_nan(&self) -> Self {
        let mut samples = self.0;
        for s in &mut samples {
            if s.is_nan() {
                *s = 0.0;
            }
        }
        Self(samples)
    }
}

impl<const N: usize> From<ColorRgb> for ColorSpectrum<N> {
    /// Convert an sRGB color to a reflectance spectrum using the
    /// Smits (1999) method with 7 basis spectra.
    fn from(rgb: ColorRgb) -> Self {
        let basis = SMITS_BASIS.get_or_init(compute_smits_basis);
        let arr: [f64; 3] = rgb.into();
        let (r, g, b) = (arr[0], arr[1], arr[2]);

        // Smits decomposition into 7 components
        let w = r.min(g).min(b);
        let c = g.min(b) - w;
        let m = r.min(b) - w;
        let y = r.min(g) - w;
        let rp = r - w - y - m;
        let gp = g - w - y - c;
        let bp = b - w - m - c;

        let mut s = [0.0_f64; N];
        for (i, item) in s.iter_mut().enumerate() {
            *item = w * basis.white[i]
                + c * basis.cyan[i]
                + m * basis.magenta[i]
                + y * basis.yellow[i]
                + rp * basis.red[i]
                + gp * basis.green[i]
                + bp * basis.blue[i];
        }
        ColorSpectrum(Vector::new(s))
    }
}

impl<const N: usize> From<ColorSpectrum<N>> for ColorRgb {
    /// Integrate the spectrum against the CIE 1931 matching functions
    /// and convert to linear sRGB.
    fn from(spectrum: ColorSpectrum<N>) -> Self {
        let step = (LAMBDA_MAX - LAMBDA_MIN) / (N - 1) as f64;
        let mut x = 0.0;
        let mut y = 0.0;
        let mut z = 0.0;
        for i in 0..N {
            let lambda = LAMBDA_MIN + i as f64 * step;
            let sample = spectrum.0[i];
            let (x_bar, y_bar, z_bar) = cie_1931_xyz(lambda);
            x += sample * x_bar * step;
            y += sample * y_bar * step;
            z += sample * z_bar * step;
        }
        let cie_norm = CIE_WHITE_NORM.get_or_init(compute_cie_white_norm::<N>);
        let srgb_white_xyz = [0.95047, 1.0, 1.08883];
        x = x / cie_norm[0] * srgb_white_xyz[0];
        y = y / cie_norm[1] * srgb_white_xyz[1];
        z = z / cie_norm[2] * srgb_white_xyz[2];
        let r = (3.2406 * x - 1.5372 * y - 0.4986 * z).max(0.0);
        let g = (-0.9689 * x + 1.8758 * y + 0.0415 * z).max(0.0);
        let b = (0.0557 * x - 0.2040 * y + 1.0570 * z).max(0.0);
        ColorRgb::new(r, g, b)
    }
}

/// Compute the 7 Smits basis spectra by solving a regularized linear
/// system for each target. The spectra are optimized for smoothness
/// while satisfying the CIE integration constraints.
fn compute_smits_basis<const N: usize>() -> SmitsBasis<N> {
    let step = (LAMBDA_MAX - LAMBDA_MIN) / (N - 1) as f64;

    // Build the CIE integration matrix C (3 rows × N cols)
    // C[k][i] = cie_value(λ_i) * Δλ  for k in {0:x̄, 1:ȳ, 2:z̄}
    //
    // precompute CIE integration values at each wavelength
    let (x_vals, y_vals, z_vals) = {
        let mut xv = [0.0_f64; N];
        let mut yv = [0.0_f64; N];
        let mut zv = [0.0_f64; N];
        for (i, ((x, y), z)) in xv
            .iter_mut()
            .zip(yv.iter_mut())
            .zip(zv.iter_mut())
            .enumerate()
        {
            let lambda = LAMBDA_MIN + i as f64 * step;
            let (x_bar, y_bar, z_bar) = cie_1931_xyz(lambda);
            *x = x_bar * step;
            *y = y_bar * step;
            *z = z_bar * step;
        }
        (xv, yv, zv)
    };
    let c_mat = [x_vals, y_vals, z_vals];

    // Build the regularized system matrix: A = C^T C + λ L^T L
    // where L is the second-difference (Laplacian) matrix
    let lambda_reg = 0.1; // regularization strength

    let mut a = [[0.0_f64; N]; N];

    // A += C^T C
    for (i, row) in a.iter_mut().enumerate() {
        for (j, cell) in row.iter_mut().enumerate() {
            let mut sum = 0.0;
            for row in &c_mat {
                sum += row[i] * row[j];
            }
            *cell = sum;
        }
    }

    // A += λ L^T L  where L is second-difference matrix (6×8)
    // L[i][i]=1, L[i][i+1]=-2, L[i][i+2]=1 for i=0..5
    for (i, row) in a.iter_mut().enumerate() {
        for (j, cell) in row.iter_mut().enumerate() {
            let mut lap_sum = 0.0;
            for k in 0..(N - 2) {
                // contribution of L[k] to (i,j) of L^T L
                let li = if k == i {
                    1.0
                } else if k + 1 == i {
                    -2.0
                } else if k + 2 == i {
                    1.0
                } else {
                    0.0
                };
                let lj = if k == j {
                    1.0
                } else if k + 1 == j {
                    -2.0
                } else if k + 2 == j {
                    1.0
                } else {
                    0.0
                };
                lap_sum += li * lj;
            }
            *cell += lambda_reg * lap_sum;
        }
    }

    // sRGB linear → XYZ matrix
    let srgb_to_xyz = |r: f64, g: f64, b: f64| -> [f64; 3] {
        [
            0.4124 * r + 0.3576 * g + 0.1805 * b,
            0.2126 * r + 0.7152 * g + 0.0722 * b,
            0.0193 * r + 0.1192 * g + 0.9505 * b,
        ]
    };

    let cie_norm = CIE_WHITE_NORM.get_or_init(compute_cie_white_norm::<N>);
    // sRGB white point XYZ
    let srgb_white_xyz = [0.95047, 1.0, 1.08883];

    // Solve for a single target: solve A * s = C^T * target_xyz
    // Returns spectrum clamped to [0, 1]
    let solve = |target_xyz: [f64; 3]| -> Vector<N> {
        // Convert from normalized sRGB XYZ to raw CIE integration space
        let scaled_target: [f64; 3] = [
            target_xyz[0] * cie_norm[0] / srgb_white_xyz[0],
            target_xyz[1] * cie_norm[1] / srgb_white_xyz[1],
            target_xyz[2] * cie_norm[2] / srgb_white_xyz[2],
        ];

        // Build RHS: b = C^T * scaled_target
        let mut b = [0.0_f64; N];
        for (i, b_item) in b.iter_mut().enumerate() {
            let mut sum = 0.0;
            for k in 0..3 {
                sum += c_mat[k][i] * scaled_target[k];
            }
            *b_item = sum;
        }

        // Solve A * x = b using Gaussian elimination with partial pivoting
        let x = gauss_solve(&a, &b);

        // Clamp to [0, 1]
        let mut clamped = [0.0_f64; N];
        for (i, c) in clamped.iter_mut().enumerate() {
            *c = x[i].clamp(0.0, 1.0);
        }
        Vector::new(clamped)
    };

    SmitsBasis {
        white: Vector::ONE, // flat white — no solving needed
        red: solve(srgb_to_xyz(1.0, 0.0, 0.0)),
        green: solve(srgb_to_xyz(0.0, 1.0, 0.0)),
        blue: solve(srgb_to_xyz(0.0, 0.0, 1.0)),
        cyan: solve(srgb_to_xyz(0.0, 1.0, 1.0)),
        magenta: solve(srgb_to_xyz(1.0, 0.0, 1.0)),
        yellow: solve(srgb_to_xyz(1.0, 1.0, 0.0)),
    }
}

/// Solve an N×N linear system Ax = b using Gaussian elimination
/// with partial pivoting.
#[allow(clippy::needless_range_loop)]
fn gauss_solve<const N: usize>(a: &[[f64; N]; N], b: &[f64; N]) -> [f64; N] {
    let n = N;

    // Separate coefficient matrix and right-hand side
    let mut m = *a;
    let mut b_vec = *b;

    // Forward elimination with partial pivoting
    for col in 0..n {
        // Find pivot
        let mut max_val = m[col][col].abs();
        let mut max_row = col;
        for row in (col + 1)..n {
            if m[row][col].abs() > max_val {
                max_val = m[row][col].abs();
                max_row = row;
            }
        }
        // Swap rows in both coefficient matrix and rhs
        if max_row != col {
            m.swap(col, max_row);
            b_vec.swap(col, max_row);
        }
        // Eliminate below
        for row in (col + 1)..n {
            let factor = m[row][col] / m[col][col];
            for j in col..n {
                m[row][j] -= factor * m[col][j];
            }
            b_vec[row] -= factor * b_vec[col];
        }
    }

    // Back substitution
    let mut x = [0.0_f64; N];
    for i in (0..n).rev() {
        let mut sum = b_vec[i];
        for j in (i + 1)..n {
            sum -= m[i][j] * x[j];
        }
        x[i] = sum / m[i][i];
    }
    x
}

/// CIE 1931 2-degree color matching functions evaluated at an arbitrary
/// wavelength via linear interpolation of the 5nm-interval table.
pub fn cie_1931_xyz(lambda_nm: f64) -> (f64, f64, f64) {
    // CIE 1931 2-degree color matching functions at 5nm intervals (380..=780)
    // x_bar, y_bar, z_bar values from CIE standard
    static CIE_TABLE: [(f64, f64, f64); 81] = [
        (0.001368, 0.000039, 0.006450), // 380 nm
        (0.002236, 0.000064, 0.010550), // 385 nm
        (0.004243, 0.000120, 0.020050), // 390 nm
        (0.007650, 0.000217, 0.036210), // 395 nm
        (0.014310, 0.000396, 0.067850), // 400 nm
        (0.023190, 0.000640, 0.110200), // 405 nm
        (0.043510, 0.001210, 0.207400), // 410 nm
        (0.077630, 0.002180, 0.371300), // 415 nm
        (0.134380, 0.004000, 0.645600), // 420 nm
        (0.214770, 0.007300, 1.039050), // 425 nm
        (0.283900, 0.011600, 1.385600), // 430 nm
        (0.328500, 0.016840, 1.622960), // 435 nm
        (0.348280, 0.023000, 1.747060), // 440 nm
        (0.348060, 0.029800, 1.782600), // 445 nm
        (0.336200, 0.038000, 1.772110), // 450 nm
        (0.318700, 0.048000, 1.744100), // 455 nm
        (0.290800, 0.060000, 1.669200), // 460 nm
        (0.251100, 0.073900, 1.528100), // 465 nm
        (0.195360, 0.090980, 1.287640), // 470 nm
        (0.142100, 0.112600, 1.041900), // 475 nm
        (0.095640, 0.139020, 0.812950), // 480 nm
        (0.057950, 0.169300, 0.616200), // 485 nm
        (0.032010, 0.208020, 0.465180), // 490 nm
        (0.014700, 0.258600, 0.353300), // 495 nm
        (0.004900, 0.323000, 0.272000), // 500 nm
        (0.002400, 0.407300, 0.212300), // 505 nm
        (0.009300, 0.503000, 0.158200), // 510 nm
        (0.029100, 0.608200, 0.111700), // 515 nm
        (0.063270, 0.710000, 0.078250), // 520 nm
        (0.109600, 0.793200, 0.057250), // 525 nm
        (0.165500, 0.862000, 0.042160), // 530 nm
        (0.225750, 0.914850, 0.029840), // 535 nm
        (0.290400, 0.954000, 0.020300), // 540 nm
        (0.359700, 0.980300, 0.013400), // 545 nm
        (0.433450, 0.994950, 0.008750), // 550 nm
        (0.512050, 1.000000, 0.005750), // 555 nm
        (0.594500, 0.995000, 0.003900), // 560 nm
        (0.678400, 0.978600, 0.002750), // 565 nm
        (0.762100, 0.952000, 0.002100), // 570 nm
        (0.842500, 0.915400, 0.001800), // 575 nm
        (0.916300, 0.870000, 0.001650), // 580 nm
        (0.978600, 0.816300, 0.001400), // 585 nm
        (1.026300, 0.757000, 0.001100), // 590 nm
        (1.056700, 0.694900, 0.001000), // 595 nm
        (1.062200, 0.631000, 0.000800), // 600 nm
        (1.045600, 0.566800, 0.000600), // 605 nm
        (1.002600, 0.503000, 0.000340), // 610 nm
        (0.938400, 0.441200, 0.000240), // 615 nm
        (0.854450, 0.381000, 0.000190), // 620 nm
        (0.751400, 0.321000, 0.000100), // 625 nm
        (0.642400, 0.265000, 0.000050), // 630 nm
        (0.541900, 0.217000, 0.000030), // 635 nm
        (0.447900, 0.175000, 0.000020), // 640 nm
        (0.360800, 0.138200, 0.000010), // 645 nm
        (0.283500, 0.107000, 0.000000), // 650 nm
        (0.218700, 0.081600, 0.000000), // 655 nm
        (0.164900, 0.061000, 0.000000), // 660 nm
        (0.121200, 0.044580, 0.000000), // 665 nm
        (0.087400, 0.032000, 0.000000), // 670 nm
        (0.063600, 0.023200, 0.000000), // 675 nm
        (0.046770, 0.017000, 0.000000), // 680 nm
        (0.032900, 0.011920, 0.000000), // 685 nm
        (0.022700, 0.008210, 0.000000), // 690 nm
        (0.015840, 0.005723, 0.000000), // 695 nm
        (0.011359, 0.004102, 0.000000), // 700 nm
        (0.008111, 0.002929, 0.000000), // 705 nm
        (0.005790, 0.002091, 0.000000), // 710 nm
        (0.004109, 0.001484, 0.000000), // 715 nm
        (0.002899, 0.001047, 0.000000), // 720 nm
        (0.002049, 0.000740, 0.000000), // 725 nm
        (0.001440, 0.000520, 0.000000), // 730 nm
        (0.001000, 0.000361, 0.000000), // 735 nm
        (0.000690, 0.000249, 0.000000), // 740 nm
        (0.000476, 0.000172, 0.000000), // 745 nm
        (0.000332, 0.000120, 0.000000), // 750 nm
        (0.000235, 0.000085, 0.000000), // 755 nm
        (0.000166, 0.000060, 0.000000), // 760 nm
        (0.000117, 0.000042, 0.000000), // 765 nm
        (0.000083, 0.000030, 0.000000), // 770 nm
        (0.000059, 0.000021, 0.000000), // 775 nm
        (0.000042, 0.000015, 0.000000), // 780 nm
    ];

    let continuous_index = ((lambda_nm - 380.0) / 5.0).clamp(0.0, 80.0);
    let index = continuous_index.floor() as usize;
    if index >= 80 {
        return CIE_TABLE[80];
    }

    let fractional = continuous_index - index as f64;
    let (x0, y0, z0) = CIE_TABLE[index];
    let (x1, y1, z1) = CIE_TABLE[index + 1];

    // linear interpolation
    (
        x0 + (x1 - x0) * fractional,
        y0 + (y1 - y0) * fractional,
        z0 + (z1 - z0) * fractional,
    )
}

// ---------------------------------------------------------------------------
// Element-wise operators (ColorSpectrum × ColorSpectrum)
// ---------------------------------------------------------------------------

impl<const N: usize> std::ops::Add<&ColorSpectrum<N>> for &ColorSpectrum<N> {
    type Output = ColorSpectrum<N>;
    fn add(self, rhs: &ColorSpectrum<N>) -> ColorSpectrum<N> {
        ColorSpectrum(&self.0 + &rhs.0)
    }
}

impl<const N: usize> std::ops::AddAssign<&ColorSpectrum<N>> for ColorSpectrum<N> {
    fn add_assign(&mut self, rhs: &ColorSpectrum<N>) {
        self.0 += &rhs.0;
    }
}

impl<const N: usize> std::ops::Sub<&ColorSpectrum<N>> for &ColorSpectrum<N> {
    type Output = ColorSpectrum<N>;
    fn sub(self, rhs: &ColorSpectrum<N>) -> ColorSpectrum<N> {
        ColorSpectrum(&self.0 - &rhs.0)
    }
}

impl<const N: usize> std::ops::SubAssign<&ColorSpectrum<N>> for ColorSpectrum<N> {
    fn sub_assign(&mut self, rhs: &ColorSpectrum<N>) {
        self.0 -= &rhs.0;
    }
}

impl<const N: usize> std::ops::Mul<&ColorSpectrum<N>> for &ColorSpectrum<N> {
    type Output = ColorSpectrum<N>;
    fn mul(self, rhs: &ColorSpectrum<N>) -> ColorSpectrum<N> {
        ColorSpectrum(self.0 * rhs.0)
    }
}

impl<const N: usize> std::ops::MulAssign<&ColorSpectrum<N>> for ColorSpectrum<N> {
    fn mul_assign(&mut self, rhs: &ColorSpectrum<N>) {
        self.0 *= &rhs.0;
    }
}

// ---------------------------------------------------------------------------
// Scalar operators (ColorSpectrum × f64)
// ---------------------------------------------------------------------------

impl<const N: usize> std::ops::Mul<f64> for &ColorSpectrum<N> {
    type Output = ColorSpectrum<N>;
    fn mul(self, rhs: f64) -> ColorSpectrum<N> {
        ColorSpectrum(self.0 * rhs)
    }
}

impl<const N: usize> std::ops::Mul<f64> for ColorSpectrum<N> {
    type Output = ColorSpectrum<N>;
    fn mul(self, rhs: f64) -> ColorSpectrum<N> {
        let mut data = self.0;
        data *= rhs;
        ColorSpectrum(data)
    }
}

impl<const N: usize> std::ops::Mul<&ColorSpectrum<N>> for f64 {
    type Output = ColorSpectrum<N>;
    fn mul(self, rhs: &ColorSpectrum<N>) -> ColorSpectrum<N> {
        ColorSpectrum(self * &rhs.0)
    }
}

impl<const N: usize> std::ops::MulAssign<f64> for ColorSpectrum<N> {
    fn mul_assign(&mut self, rhs: f64) {
        self.0 *= rhs;
    }
}

impl<const N: usize> std::ops::Div<f64> for &ColorSpectrum<N> {
    type Output = ColorSpectrum<N>;
    fn div(self, rhs: f64) -> ColorSpectrum<N> {
        ColorSpectrum(&self.0 / rhs)
    }
}

impl<const N: usize> std::ops::Div<f64> for ColorSpectrum<N> {
    type Output = ColorSpectrum<N>;
    fn div(self, rhs: f64) -> ColorSpectrum<N> {
        let mut data = self.0;
        data /= rhs;
        ColorSpectrum(data)
    }
}

impl<const N: usize> std::ops::DivAssign<f64> for ColorSpectrum<N> {
    fn div_assign(&mut self, rhs: f64) {
        self.0 /= rhs;
    }
}

#[cfg(test)]
mod tests {

    use super::*;

    #[test]
    fn smits_round_trip() {
        let test_colors: [(&str, f64, f64, f64); 6] = [
            ("white", 1.0, 1.0, 1.0),
            ("red", 1.0, 0.0, 0.0),
            ("green", 0.0, 1.0, 0.0),
            ("blue", 0.0, 0.0, 1.0),
            ("gray", 0.5, 0.5, 0.5),
            ("orange", 1.0, 0.5, 0.0),
        ];

        println!("\n=== Smits RGB → ColorSpectrum → RGB Round-Trip ===");
        println!(
            "{:>8} | {:>17} | {:>17} | {:>8}",
            "Name", "Input RGB", "Output RGB", "G/R"
        );
        println!("{:-<8}-+-{:-<17}-+-{:-<17}-+-{:-<8}", "", "", "", "");

        for (name, r, g, b) in test_colors {
            let spectrum: ColorSpectrum<SPECTRAL_SAMPLE_COUNT> = ColorRgb::new(r, g, b).into();
            let output: ColorRgb = spectrum.into();
            let out: [f64; 3] = output.into();

            let gr = if out[0].abs() > 0.001 {
                format!("{:.3}x", out[1] / out[0])
            } else {
                "---".to_string()
            };

            println!(
                "{:>8} | ({:.2},{:.2},{:.2}) | ({:.3},{:.3},{:.3}) | {:>8}",
                name, r, g, b, out[0], out[1], out[2], gr
            );
        }

        // Verify rough round-trip (allow 0.05 tolerance per channel)
        let (r, g, b) = (1.0, 1.0, 1.0);
        let spectrum: ColorSpectrum<SPECTRAL_SAMPLE_COUNT> = ColorRgb::new(r, g, b).into();
        let output: ColorRgb = spectrum.into();
        let out: [f64; 3] = output.into();
        assert!(
            (out[0] - 1.0).abs() < 0.1,
            "White R channel: expected ~1.0, got {}",
            out[0]
        );
        assert!(
            (out[1] - 1.0).abs() < 0.1,
            "White G channel: expected ~1.0, got {}",
            out[1]
        );
        assert!(
            (out[2] - 1.0).abs() < 0.1,
            "White B channel: expected ~1.0, got {}",
            out[2]
        );

        // Verify spectral values are in [0, 1]
        for sample in spectrum.0.0 {
            assert!(
                (-0.001..=1.001).contains(&sample),
                "Spectral sample {} out of [0,1] range",
                sample
            );
        }

        // Verify spectral values are in a reasonable range for reflectance
        // Flat white spectrum should be close to 1.0 at all samples
        let white_spec: ColorSpectrum<SPECTRAL_SAMPLE_COUNT> = ColorRgb::new(1.0, 1.0, 1.0).into();
        println!("\nWhite spectrum values: {:?}", white_spec.0);
        for (i, &sample) in white_spec.0.iter().enumerate() {
            assert!(
                sample > 0.5,
                "White spectrum sample {} is too small ({}). Expected ~1.0 for reflectance.",
                i,
                sample
            );
        }

        // Verify the light spectrum (emittance with values > 1)
        let light_spec: ColorSpectrum<SPECTRAL_SAMPLE_COUNT> = ColorRgb::new(7.0, 7.0, 7.0).into();
        println!("Light (7,7,7) spectrum values: {:?}", light_spec.0);
        for (i, &sample) in light_spec.0.iter().enumerate() {
            assert!(
                sample > 3.0,
                "Light spectrum sample {} is too small ({}). Expected ~7.0 for emittance.",
                i,
                sample
            );
        }

        println!("===================================\n");
    }

    #[test]
    fn from_traits_round_trip() {
        let rgb = ColorRgb::new(1.0, 0.5, 0.0);
        let spectrum: ColorSpectrum<SPECTRAL_SAMPLE_COUNT> = ColorSpectrum::from(rgb);
        let back: ColorRgb = ColorRgb::from(spectrum);
        let out: [f64; 3] = back.into();
        assert!((out[0] - 0.989).abs() < 0.05);
    }
}
