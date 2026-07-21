/// A unit quaternion (scalar-first: w + xi + yj + zk).
///
/// The `Display` / `Debug` order is `{ w, x, y, z }`, matching the JSON
/// serialization format.
#[derive(Clone, Copy, Debug)]
pub struct Quaternion {
    pub w: f64,
    pub x: f64,
    pub y: f64,
    pub z: f64,
}

impl Quaternion {
    /// The identity quaternion (no rotation).
    pub const IDENTITY: Self = Self {
        w: 1.0,
        x: 0.0,
        y: 0.0,
        z: 0.0,
    };

    /// Create a unit quaternion from raw components.
    ///
    /// Normalizes the input to unit length. If the input length is
    /// zero or degenerate, returns [`IDENTITY`].
    pub fn new(w: f64, x: f64, y: f64, z: f64) -> Self {
        let len_sq = w * w + x * x + y * y + z * z;
        if len_sq <= 0.0 {
            return Self::IDENTITY;
        }
        let inv_len = 1.0 / len_sq.sqrt();
        Self {
            w: w * inv_len,
            x: x * inv_len,
            y: y * inv_len,
            z: z * inv_len,
        }
    }

    /// Create a unit quaternion from a `[w, x, y, z]` array.
    ///
    /// Convenience constructor for deserialization — delegates to [`new`].
    pub fn from_array([w, x, y, z]: [f64; 4]) -> Self {
        Self::new(w, x, y, z)
    }
}
