use crate::{
    geometry::Vector,
    shading::{
        ColorSpectrum,
        color_spectrum::SPECTRAL_SAMPLE_COUNT,
        hero_wavelengths::HeroWavelengths,
    },
};

/// The medium a ray is currently traveling through.
///
/// `Vacuum` is fully transparent (no absorption at any wavelength).
/// `Homogeneous` applies homogeneous Beer-Lambert absorption: T(d) = C^(d/d₀),
/// with C(λ) sampled from the `transmittance` spectrum at each wavelength.
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum Medium {
    /// Fully transparent — transmittance is always 1.0, emission is always 0.
    Vacuum,
    /// Homogeneous absorbing and emitting medium.
    Homogeneous {
        /// Reference distance at which `transmittance` is measured.
        attenuation_distance: f64,
        /// Per-wavelength transmittance after traveling `attenuation_distance`.
        transmittance: ColorSpectrum<SPECTRAL_SAMPLE_COUNT>,
        /// Target radiance a thick slab converges to (coupled Kirchhoff model).
        emittance: ColorSpectrum<SPECTRAL_SAMPLE_COUNT>,
    },
}

impl Medium {
    /// Return the per-wavelength transmittance factor for a ray segment
    /// of length `distance` through this medium. For `Vacuum` this is
    /// always `Vector::ONE` (no attenuation).
    pub fn transmittance<const N: usize>(
        &self,
        hw: &HeroWavelengths<N>,
        distance: f64,
    ) -> Vector<N> {
        match self {
            Medium::Vacuum => Vector::ONE,
            Medium::Homogeneous {
                attenuation_distance,
                transmittance,
                ..
            } => {
                let mut factors = Vector::<N>::ZERO;
                let inv_d0 = 1.0 / attenuation_distance;
                for (i, &lambda) in hw.iter().enumerate() {
                    let c = transmittance.sample_wavelength(lambda);
                    factors[i] = (distance * inv_d0 * c.ln()).exp();
                }
                factors
            }
        }
    }

    /// Return the per-wavelength emitted radiance from a ray segment of
    /// length `distance` through this medium. Uses the coupled emission
    /// model (Kirchhoff's law): a medium can only emit where it absorbs.
    /// For `Vacuum`, returns `Vector::ZERO` (no emission).
    ///
    /// Formula: `L_e(λ) * (1 - e^(-σ_a(λ) * t))`, which saturates
    /// to `L_e(λ)` in thick media.
    pub fn emission<const N: usize>(
        &self,
        hw: &HeroWavelengths<N>,
        distance: f64,
    ) -> Vector<N> {
        match self {
            Medium::Vacuum => Vector::ZERO,
            Medium::Homogeneous {
                attenuation_distance,
                transmittance,
                emittance,
            } => {
                let mut out = Vector::<N>::ZERO;
                let inv_d0 = 1.0 / attenuation_distance;
                for (i, &lambda) in hw.iter().enumerate() {
                    let c = transmittance.sample_wavelength(lambda);
                    let tr = (distance * inv_d0 * c.ln()).exp();
                    let le = emittance.sample_wavelength(lambda);
                    out[i] = le * (1.0 - tr);
                }
                out
            }
        }
    }

    /// Return the transmittance at a specific wavelength.
    /// For `Vacuum`, returns 1.0 (fully transparent).
    pub fn transmittance_at(&self, wavelength_nm: f64) -> f64 {
        match self {
            Medium::Vacuum => 1.0,
            Medium::Homogeneous {
                transmittance, ..
            } => transmittance.sample_wavelength(wavelength_nm),
        }
    }
}
