use crate::geometry::Vector3;

/// An orthonormal basis {u, v, w} for orienting Z-axis-relative
/// direction vectors to an arbitrary surface normal.
///
/// `w` is the surface normal direction. `u` and `v` span the
/// tangent plane perpendicular to `w`.
#[derive(Debug, Clone, Copy)]
pub struct Onb {
    pub u: Vector3,
    pub v: Vector3,
    pub w: Vector3,
}

impl Onb {
    /// Build an ONB from a unit surface normal.
    ///
    /// Picks an auxiliary vector that is not parallel to `normal`,
    /// then builds `u`, `v` via cross products so that `{u, v, w}`
    /// forms a right-handed orthonormal basis.
    pub fn from_w(normal: Vector3) -> Self {
        let w = normal.unit_vector();
        let a = if w.x.abs() > 0.9 {
            // normal is nearly parallel to +X — use +Y as auxiliary
            Vector3 {
                x: 0.0,
                y: 1.0,
                z: 0.0,
            }
        } else {
            Vector3 {
                x: 1.0,
                y: 0.0,
                z: 0.0,
            }
        };
        let v = w.cross(a).unit_vector();
        let u = w.cross(v); // automatically unit-length since w ⊥ v
        Self { u, v, w }
    }

    /// Transform a direction from the ONB's local frame to world space.
    ///
    /// In the local frame, +Z corresponds to the surface normal (`w`).
    /// For example, feeding this a cosine-weighted direction (biased
    /// toward +Z) produces a direction biased toward the surface normal
    /// in world space.
    pub fn to_world(&self, v: Vector3) -> Vector3 {
        v.x * self.u + v.y * self.v + v.z * self.w
    }
}
