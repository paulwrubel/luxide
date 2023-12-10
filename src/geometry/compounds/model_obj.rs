use std::sync::Arc;

use crate::{
    geometry::{primitives::Triangle, Geometric, Point, Ray, RayHit, Vector, AABB},
    shading::materials::Material,
    utils::Interval,
};

use super::{List, BVH};

pub struct ModelObj {
    geometric: ListOrBVH,
}

impl ModelObj {
    pub fn from_filename(
        filename: &str,
        origin: Point,
        scale: f64,
        recalculate_normals: bool,
        use_bvh: bool,
        material: Arc<dyn Material>,
    ) -> Result<ModelObj, String> {
        let load_options = tobj::LoadOptions {
            triangulate: true,
            single_index: true,
            ..tobj::LoadOptions::default()
        };
        let (models, _materials) = tobj::load_obj(filename, &load_options).map_err(|err| {
            format!(
                "Error loading model from file \"{}\": {}",
                filename,
                err.to_string()
            )
        })?;

        let offset = origin.0;

        let mut triangles = List::new();
        let mut bounding_box = AABB::EMPTY;
        for model in models {
            let mesh = &model.mesh;

            // safety checks
            if mesh.indices.len() % 3 != 0 {
                return Err(format!(
                    "Mesh for model \"{}\" has an invalid number of indices: {}",
                    model.name,
                    mesh.indices.len()
                ));
            }
            if !recalculate_normals && mesh.positions.len() != mesh.normals.len() {
                return Err(format!(
                    "Mesh for model \"{}\" has different number of positions ({}) and normals ({}) (maybe you meant to set \"recalculate_normals\" to true?)",
                    model.name, mesh.positions.len(), mesh.normals.len()
                ));
            }

            // get data
            for i in (0..mesh.indices.len()).step_by(3) {
                let a_index = mesh.indices[i] as usize;
                let b_index = mesh.indices[i + 1] as usize;
                let c_index = mesh.indices[i + 2] as usize;

                let a = Point::new(
                    mesh.positions[a_index * 3 + 0] as f64,
                    mesh.positions[a_index * 3 + 1] as f64,
                    mesh.positions[a_index * 3 + 2] as f64,
                );
                let b = Point::new(
                    mesh.positions[b_index * 3 + 0] as f64,
                    mesh.positions[b_index * 3 + 1] as f64,
                    mesh.positions[b_index * 3 + 2] as f64,
                );
                let c = Point::new(
                    mesh.positions[c_index * 3 + 0] as f64,
                    mesh.positions[c_index * 3 + 1] as f64,
                    mesh.positions[c_index * 3 + 2] as f64,
                );

                let a_normal = if recalculate_normals {
                    a.to(b).cross(a.to(c)).unit_vector()
                } else {
                    Vector::new(
                        mesh.normals[a_index * 3 + 0] as f64,
                        mesh.normals[a_index * 3 + 1] as f64,
                        mesh.normals[a_index * 3 + 2] as f64,
                    )
                    .unit_vector()
                };
                let b_normal = if recalculate_normals {
                    a.to(b).cross(a.to(c)).unit_vector()
                } else {
                    Vector::new(
                        mesh.normals[b_index * 3 + 0] as f64,
                        mesh.normals[b_index * 3 + 1] as f64,
                        mesh.normals[b_index * 3 + 2] as f64,
                    )
                    .unit_vector()
                };
                let c_normal = if recalculate_normals {
                    a.to(b).cross(a.to(c)).unit_vector()
                } else {
                    Vector::new(
                        mesh.normals[c_index * 3 + 0] as f64,
                        mesh.normals[c_index * 3 + 1] as f64,
                        mesh.normals[c_index * 3 + 2] as f64,
                    )
                    .unit_vector()
                };

                let transformed_a = Point::from_vector(a.0 * scale) + offset;
                let transformed_b = Point::from_vector(b.0 * scale) + offset;
                let transformed_c = Point::from_vector(c.0 * scale) + offset;

                triangles.push(Arc::new(Triangle::new_with_normals(
                    transformed_a,
                    transformed_b,
                    transformed_c,
                    a_normal,
                    b_normal,
                    c_normal,
                    false,
                    Arc::clone(&material),
                )));
            }
        }

        let geometric = if use_bvh {
            ListOrBVH::BVH(BVH::from_list(triangles))
        } else {
            ListOrBVH::List(triangles)
        };

        Ok(Self { geometric })
    }
}

impl Geometric for ModelObj {
    fn intersect(&self, ray: Ray, ray_t: Interval) -> Option<RayHit> {
        self.geometric.intersect(ray, ray_t)
    }

    fn bounding_box(&self) -> AABB {
        self.geometric.bounding_box()
    }
}

enum ListOrBVH {
    List(List),
    BVH(BVH),
}

impl Geometric for ListOrBVH {
    fn intersect(&self, ray: Ray, ray_t: Interval) -> Option<RayHit> {
        match self {
            ListOrBVH::List(list) => list.intersect(ray, ray_t),
            ListOrBVH::BVH(bvh) => bvh.intersect(ray, ray_t),
        }
    }

    fn bounding_box(&self) -> AABB {
        match self {
            ListOrBVH::List(list) => list.bounding_box(),
            ListOrBVH::BVH(bvh) => bvh.bounding_box(),
        }
    }
}
