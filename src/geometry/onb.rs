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
    /// `w` is the normal. `u` and `v` are found by computing the shortest-arc
    /// rotation that carries the +Z axis onto `w`, then applying that same
    /// rotation to the +X and +Y axes. For `w = +Z` the basis is the identity
    /// (`u = +X`, `v = +Y`), and it varies continuously as `w` tilts away,
    /// which keeps texture UV orientations stable and predictable.
    ///
    /// The frame is continuous everywhere except at the antipodal pole
    /// `w = -Z`, where the shortest-arc rotation is undefined and the tangent
    /// directions become discontinuous (an unavoidable consequence of the
    /// hairy-ball theorem — no tangent frame is continuous over the whole
    /// sphere). At that pole a fixed 180° rotation is used.
    pub fn from_w(normal: Vector3) -> Self {
        let w = normal.unit_vector();
        let u = Vector3::UNIT_X.rotated_between(Vector3::UNIT_Z, w);
        let v = Vector3::UNIT_Y.rotated_between(Vector3::UNIT_Z, w);
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
