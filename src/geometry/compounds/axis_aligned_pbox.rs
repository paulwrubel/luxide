use std::sync::Arc;

use crate::{
    geometry::{Aabb, Geometric, Point, Ray, RayHit, Vector, primitives::Parallelogram},
    shading::materials::Material,
    utils::Interval,
};

use super::List;

#[derive(Clone, Debug)]
pub struct AxisAlignedPBox(List);

impl AxisAlignedPBox {
    pub fn new(a: Point, b: Point, is_culled: bool, material: Arc<dyn Material>) -> Self {
        let min = a.min_components_point(b);
        let max = a.max_components_point(b);

        let dx = Vector::new(max.0.x - min.0.x, 0.0, 0.0);
        let dy = Vector::new(0.0, max.0.y - min.0.y, 0.0);
        let dz = Vector::new(0.0, 0.0, max.0.z - min.0.z);

        let mut faces = List::new();
        // front
        faces.push(Arc::new(Parallelogram::new(
            Point::new(min.0.x, min.0.y, max.0.z),
            dx,
            dy,
            is_culled,
            Arc::clone(&material),
        )));
        // right
        faces.push(Arc::new(Parallelogram::new(
            Point::new(max.0.x, min.0.y, max.0.z),
            -dz,
            dy,
            is_culled,
            Arc::clone(&material),
        )));
        // back
        faces.push(Arc::new(Parallelogram::new(
            Point::new(max.0.x, min.0.y, min.0.z),
            -dx,
            dy,
            is_culled,
            Arc::clone(&material),
        )));
        // left
        faces.push(Arc::new(Parallelogram::new(
            Point::new(min.0.x, min.0.y, min.0.z),
            dz,
            dy,
            is_culled,
            Arc::clone(&material),
        )));
        // top
        faces.push(Arc::new(Parallelogram::new(
            Point::new(min.0.x, max.0.y, max.0.z),
            dx,
            -dz,
            is_culled,
            Arc::clone(&material),
        )));
        // bottom
        faces.push(Arc::new(Parallelogram::new(
            Point::new(min.0.x, min.0.y, min.0.z),
            dx,
            dz,
            is_culled,
            Arc::clone(&material),
        )));

        Self(faces)
    }
}

impl Geometric for AxisAlignedPBox {
    fn intersect(&self, ray: Ray, ray_t: Interval) -> Option<RayHit> {
        self.0.intersect(ray, ray_t)
    }

    fn surface_area(&self) -> f64 {
        self.0.surface_area()
    }

    fn is_emissive(&self) -> bool {
        self.0.is_emissive()
    }

    fn is_transmissive(&self) -> bool {
        self.0.is_transmissive()
    }

    fn is_specular(&self) -> bool {
        self.0.is_specular()
    }

    fn is_empty(&self) -> bool {
        self.0.is_empty()
    }

    fn bounding_box(&self) -> Aabb {
        self.0.bounding_box()
    }

    fn sample_direction_from(&self, origin: Point) -> Vector {
        self.0.sample_direction_from(origin)
    }

    fn direction_pdf(&self, origin: Point, dir: Vector) -> f64 {
        self.0.direction_pdf(origin, dir)
    }
}
