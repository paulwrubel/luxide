use crate::geometry::vector::Vector;

pub struct Onb {
    pub u: Vector,
    pub v: Vector,
    pub w: Vector,
}

impl Onb {
    pub fn build_from_w(normal: Vector) -> Self {
        let w = normal.unit_vector();
        let a = if w.x.abs() > 0.9 {
            Vector {
                x: 0.0,
                y: 1.0,
                z: 0.0,
            }
        } else {
            Vector {
                x: 1.0,
                y: 0.0,
                z: 0.0,
            }
        };
        let v = w.cross(a).unit_vector();
        let u = w.cross(v);
        Self { u, v, w }
    }

    pub fn local(&self, x: f64, y: f64, z: f64) -> Vector {
        x * self.u + y * self.v + z * self.w
    }

    pub fn local_from_vec(&self, v: Vector) -> Vector {
        self.local(v.x, v.y, v.z)
    }
}
