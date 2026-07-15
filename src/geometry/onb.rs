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
    /// sphere). At that pole a fixed 180° rotation about -Y is used.
    pub fn from_w(normal: Vector3) -> Self {
        let w = normal.unit_vector();

        let v_from = Vector3::new(0.0, 0.0, 1.0);
        let r = v_from.dot(w) + 1.0;

        // build the quaternion (qx, qy, qz, qw) rotating +Z onto w
        let (qx, qy, qz, qw): (f64, f64, f64, f64) = if r < 1e-8 {
            // +Z and w are antiparallel: the shortest-arc rotation is
            // undefined, so rotate 180° about any axis in the XY-plane.
            // -Y is perpendicular to +Z and gives a right-handed result.
            (0.0, -1.0, 0.0, 0.0)
        } else {
            let cross = v_from.cross(w);
            (cross.x, cross.y, cross.z, r)
        };

        // normalize the quaternion
        let q_len = (qx * qx + qy * qy + qz * qz + qw * qw).sqrt();
        let (qx, qy, qz, qw) = (qx / q_len, qy / q_len, qz / q_len, qw / q_len);
        let q_vec = Vector3::new(qx, qy, qz);

        // rotate a vector by the quaternion: v_rot = v + 2*qw*(q_vec × v) + q_vec × (2 * (q_vec × v))
        let rotate = |v: Vector3| {
            let t = q_vec.cross(v) * 2.0;
            v + t * qw + q_vec.cross(t)
        };

        let u = rotate(Vector3::new(1.0, 0.0, 0.0));
        let v = rotate(Vector3::new(0.0, 1.0, 0.0));

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
