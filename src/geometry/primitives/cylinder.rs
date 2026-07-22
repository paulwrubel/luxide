use std::f64::consts::TAU;
use std::sync::Arc;

use serde::{Deserialize, Serialize};

use crate::{
    geometry::{Aabb, Geometric, Onb, Point, Ray, RayHit, Vector3, primitives::Disk},
    shading::materials::Material,
    utils::{Interval, solve_quadratic},
};

/// Describes what happens at one end of a cylinder.
#[derive(Clone, Copy, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum CylinderEnd {
    /// Cylinder stops here, end-cap disk present.
    Capped,
    /// Cylinder stops here, no cap (open tube end).
    Open,
    /// Cylinder extends past this point forever along the axis.
    Infinite,
}

/// A positionable cylinder defined by two endpoints and an orthonormal
/// basis (ONB) that orients the axis from `a` to `b`.
///
/// Each end can be independently capped, open, or infinite.  When both
/// ends are finite the cylinder is fully bounded; if either end is
/// `Infinite` the lateral surface extends without bound in that direction.
#[derive(Clone, Debug)]
pub struct Cylinder {
    a: Point,
    a_end: CylinderEnd,
    b_end: CylinderEnd,
    radius: f64,
    material: Arc<dyn Material>,

    // precomputed
    height: f64,
    onb: Onb,
    bounding_box: Aabb,
    a_cap: Option<Disk>,
    b_cap: Option<Disk>,
    lateral_area: f64,
}

impl Cylinder {
    #[allow(clippy::too_many_arguments)]
    pub fn new(
        a: Point,
        a_end: CylinderEnd,
        b: Point,
        b_end: CylinderEnd,
        radius: f64,
        material: Arc<dyn Material>,
    ) -> Result<Self, String> {
        if radius <= 0.0 {
            return Err("cylinder radius must be positive".to_string());
        }
        let delta = a.to(b);
        if delta.squared_length() <= 1e-12 {
            return Err("cylinder endpoints must be distinct".to_string());
        }

        let axis = delta.unit_vector();
        let height = delta.length();

        // Build a tangent frame that matches the frontend Three.js preview,
        // whose cylinder is oriented by the shortest-arc rotation from its
        // native +Y axis onto `axis`. Xf/Zf are the preview's local +X/+Z
        // tangents in world space; assigning u=Zf, v=Xf, w=axis makes the
        // torso and cap texture UVs align with the preview.
        let xf = Vector3::UNIT_X.rotated_between(Vector3::UNIT_Y, axis);
        let zf = Vector3::UNIT_Z.rotated_between(Vector3::UNIT_Y, axis);
        let onb = Onb {
            u: zf,
            v: xf,
            w: axis,
        };

        // bounding box
        let bounding_box = {
            let ru = onb.u * radius;
            let rv = onb.v * radius;
            let offsets = [ru + rv, ru - rv, -ru + rv, -ru - rv];
            // collect 8 corner points: a ± r*u ± r*v and b ± r*u ± r*v
            let mut points = Vec::with_capacity(8);
            for &offset in &offsets {
                points.push(a + offset);
                points.push(b + offset);
            }
            let finite_aabb = Aabb::from_points(&points).pad(0.0001);

            if a_end == CylinderEnd::Infinite || b_end == CylinderEnd::Infinite {
                // for axes where the cylinder axis has a component, expand to UNIVERSE
                Aabb::new(
                    if axis.x.abs() > 1e-12 {
                        Interval::UNIVERSE
                    } else {
                        finite_aabb.x_interval
                    },
                    if axis.y.abs() > 1e-12 {
                        Interval::UNIVERSE
                    } else {
                        finite_aabb.y_interval
                    },
                    if axis.z.abs() > 1e-12 {
                        Interval::UNIVERSE
                    } else {
                        finite_aabb.z_interval
                    },
                )
            } else {
                finite_aabb
            }
        };

        // cap disks with explicit tangent frames matching the frontend preview.
        // The preview's bottom cap flips the V axis (Three.js `sign = -1`), so
        // the a-end cap uses v = -Xf; both caps keep u = Zf. w is the cap
        // normal (a-end faces -axis, b-end faces +axis).
        let a_cap = if a_end == CylinderEnd::Capped {
            Some(
                Disk::new_with_onb(
                    a,
                    radius,
                    0.0,
                    Arc::clone(&material),
                    Onb {
                        u: zf,
                        v: -xf,
                        w: -axis,
                    },
                )
                .expect("cap disk parameters are valid"),
            )
        } else {
            None
        };
        let b_cap = if b_end == CylinderEnd::Capped {
            Some(
                Disk::new_with_onb(
                    b,
                    radius,
                    0.0,
                    Arc::clone(&material),
                    Onb {
                        u: zf,
                        v: xf,
                        w: axis,
                    },
                )
                .expect("cap disk parameters are valid"),
            )
        } else {
            None
        };

        // lateral surface area (infinite when either end is unbounded)
        let lateral_area = if a_end == CylinderEnd::Infinite || b_end == CylinderEnd::Infinite {
            f64::INFINITY
        } else {
            radius * TAU * height
        };

        Ok(Self {
            a,
            a_end,
            b_end,
            radius,
            material,
            height,
            onb,
            bounding_box,
            a_cap,
            b_cap,
            lateral_area,
        })
    }
}

impl Geometric for Cylinder {
    fn intersect(&self, ray: Ray, ray_t: Interval) -> Option<RayHit> {
        let mut hit: Option<RayHit> = None;

        // transform ray to local ONB coordinates where the cylinder axis
        // is the local Z axis, a is at z = 0, and b is at z = height
        let delta = ray.origin - self.a;
        let local_origin = Point::new(
            delta.dot(self.onb.u),
            delta.dot(self.onb.v),
            delta.dot(self.onb.w),
        );
        let local_dir = Vector3::new(
            ray.direction.dot(self.onb.u),
            ray.direction.dot(self.onb.v),
            ray.direction.dot(self.onb.w),
        );

        // lateral surface intersection (quadratic in local x, y)
        let a_q = local_dir.x * local_dir.x + local_dir.y * local_dir.y;
        if a_q > 1e-12 {
            let b_q = 2.0 * (local_origin.0.x * local_dir.x + local_origin.0.y * local_dir.y);
            let c_q = local_origin.0.x * local_origin.0.x + local_origin.0.y * local_origin.0.y
                - self.radius * self.radius;

            for t in solve_quadratic(a_q, b_q, c_q) {
                if t < 1e-8 || !ray_t.contains_excluding(t) {
                    continue;
                }

                let local_z = local_origin.0.z + t * local_dir.z;

                // z-clip against cylinder extent
                if self.a_end != CylinderEnd::Infinite && local_z < -1e-12 {
                    continue;
                }
                if self.b_end != CylinderEnd::Infinite && local_z > self.height + 1e-12 {
                    continue;
                }

                let lx = local_origin.0.x + t * local_dir.x;
                let ly = local_origin.0.y + t * local_dir.y;

                // normal in local space (radial direction in x-y plane)
                let local_normal = Vector3::new(lx, ly, 0.0).unit_vector();
                let world_normal = self.onb.to_world(local_normal);

                // uv coordinates
                let mut phi = ly.atan2(lx);
                if phi < 0.0 {
                    phi += TAU;
                }
                let u = phi / TAU;
                let v =
                    if self.a_end != CylinderEnd::Infinite && self.b_end != CylinderEnd::Infinite {
                        local_z / self.height
                    } else {
                        0.0
                    };

                let point = ray.at(t);
                if hit.is_none() || t < hit.as_ref().unwrap().t {
                    hit = Some(RayHit {
                        t,
                        point,
                        normal: world_normal,
                        material: Arc::clone(&self.material),
                        u,
                        v,
                    });
                }
            }
        }

        // cap intersections
        for disk in [&self.a_cap, &self.b_cap].into_iter().flatten() {
            if let Some(disk_hit) = disk.intersect(ray, ray_t)
                && (hit.is_none() || disk_hit.t < hit.as_ref().unwrap().t)
            {
                hit = Some(disk_hit);
            }
        }

        hit
    }

    fn is_emissive(&self) -> bool {
        self.material.is_emissive()
    }

    fn is_transmissive(&self) -> bool {
        self.material.is_transmissive()
    }

    fn is_specular(&self) -> bool {
        self.material.is_specular()
    }

    fn is_empty(&self) -> bool {
        false
    }

    fn bounding_box(&self) -> Aabb {
        self.bounding_box
    }

    fn center(&self) -> Point {
        // finite midpoint of the two endpoints (a + b) / 2, expressed via the
        // stored axis so it stays finite even when an end is infinite. The
        // default (bounding-box centroid) would be NaN for infinite cylinders.
        self.a + self.onb.w * (self.height / 2.0)
    }

    fn surface_area(&self) -> f64 {
        if self.a_end == CylinderEnd::Infinite || self.b_end == CylinderEnd::Infinite {
            return f64::INFINITY;
        }

        let mut area = self.lateral_area;
        if let Some(ref cap) = self.a_cap {
            area += cap.surface_area();
        }
        if let Some(ref cap) = self.b_cap {
            area += cap.surface_area();
        }
        area
    }

    fn sample_direction_from(&self, origin: Point) -> Vector3 {
        // infinite cylinders are excluded from the importance sampling system
        // (direction_pdf returns 0.0, so MIS gives the geometric strategy zero
        // weight). a direction must still be returned for the mixture PDF, but
        // computing an accurate sample is not worth the effort — the geometric
        // strategy contributes nothing regardless.
        if self.a_end == CylinderEnd::Infinite || self.b_end == CylinderEnd::Infinite {
            return Vector3::random_unit();
        }

        let area = self.surface_area();
        let r = rand::random::<f64>() * area;

        // sample lateral surface
        if r < self.lateral_area {
            let z = rand::random::<f64>() * self.height;
            let phi = rand::random::<f64>() * TAU;
            let point_on_surface = self.a
                + self.onb.u * (self.radius * phi.cos())
                + self.onb.v * (self.radius * phi.sin())
                + self.onb.w * z;
            return origin.to(point_on_surface).unit_vector();
        }

        // sample caps if they exist
        if let Some(ref cap) = self.a_cap {
            let cap_area = cap.surface_area();
            if r < self.lateral_area + cap_area {
                return cap.sample_direction_from(origin);
            }
        }
        if let Some(ref cap) = self.b_cap {
            return cap.sample_direction_from(origin);
        }

        // fallback (should not reach here when area > 0)
        Vector3::random_unit()
    }

    fn direction_pdf(&self, origin: Point, dir: Vector3) -> f64 {
        if self.a_end == CylinderEnd::Infinite || self.b_end == CylinderEnd::Infinite {
            return 0.0;
        }

        let ray = Ray::new(origin, dir, 0.0);
        let Some(hit) = self.intersect(ray, Interval::UNIVERSE) else {
            return 0.0;
        };

        let cos_theta = dir.dot(hit.normal).abs();
        if cos_theta < 1e-8 {
            return 0.0;
        }

        let area = self.surface_area();
        (hit.t * hit.t) / (cos_theta * area)
    }
}
