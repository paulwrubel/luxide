use crate::{
    geometry::Vector,
    shading::{
        ColorRgb,
        color_spectrum::{
            CIE_WHITE_NORM, LAMBDA_MAX, LAMBDA_MIN, cie_1931_xyz, compute_cie_white_norm,
        },
    },
};

/// Number of hero wavelengths per camera ray.
///
/// Hero wavelength sampling (Wilkie et al., 2014) traces multiple wavelengths per
/// camera ray to share the expensive geometric exploration (BVH traversal,
/// ray-triangle intersection) across spectral samples. 4 is the sweet spot where
/// spectral variance becomes negligible relative to geometric variance: fewer
/// wavelengths waste intersection work, more add material-evaluation cost without
/// meaningfully reducing total variance. The paper found 2–8 optimal across their
/// test suite, with 4 as the recommended default.
pub const HERO_WAVELENGTH_COUNT: usize = 4;

#[derive(Debug, Copy, Clone, PartialEq)]
pub struct HeroWavelengths<const N: usize>(Vector<N>);

impl<const N: usize> HeroWavelengths<N> {
    /// Pick 4 stratified hero wavelengths by dividing 380-780nm into equal bins
    /// and picking a random wavelength within each bin.
    pub fn new_distributed() -> Self {
        use rand::RngExt;
        let mut rng = rand::rng();
        let bin_width = (LAMBDA_MAX - LAMBDA_MIN) / N as f64;
        let mut lambdas = [0.0; N];
        for (i, lambda) in lambdas.iter_mut().enumerate() {
            *lambda = LAMBDA_MIN + i as f64 * bin_width + rng.random_range(0.0..bin_width);
        }
        Self(Vector::new(lambdas))
    }

    /// Convert 4 hero wavelength radiance samples directly to RGB using the
    /// CIE 1931 matching functions evaluated at each hero wavelength.
    pub fn to_color_rgb(&self, accumulated: Vector<N>) -> ColorRgb {
        let delta_lambda = (LAMBDA_MAX - LAMBDA_MIN) / N as f64;
        let mut x = 0.0;
        let mut y = 0.0;
        let mut z = 0.0;
        for (&lambda, &acc) in self.iter().zip(accumulated.iter()) {
            let (x_bar, y_bar, z_bar) = cie_1931_xyz(lambda);
            x += acc * x_bar;
            y += acc * y_bar;
            z += acc * z_bar;
        }
        x *= delta_lambda;
        y *= delta_lambda;
        z *= delta_lambda;
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

    /// Iterate over the elements by reference.
    pub fn iter(&self) -> std::slice::Iter<'_, f64> {
        self.0.iter()
    }
}

impl<'a, const N: usize> IntoIterator for &'a HeroWavelengths<N> {
    type Item = &'a f64;
    type IntoIter = std::slice::Iter<'a, f64>;
    fn into_iter(self) -> Self::IntoIter {
        self.0.iter()
    }
}
