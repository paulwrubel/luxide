use std::sync::Arc;

use crate::{
    camera::Camera,
    geometry::{
        Geometric,
        compounds::{Bvh, List},
    },
    shading::{ColorSpectrum, color_spectrum::SPECTRAL_SAMPLE_COUNT},
};

#[derive(Clone)]
pub struct Scene {
    pub world: SceneWorld,

    pub camera: Camera,
    pub background_color: ColorSpectrum<SPECTRAL_SAMPLE_COUNT>,
}

#[derive(Clone)]
pub struct SceneWorld {
    pub world: Arc<dyn Geometric>,

    pub emissive_list: Arc<dyn Geometric>,
    pub transmissive_list: Arc<dyn Geometric>,
    pub specular_list: Arc<dyn Geometric>,
    pub virtual_list: Arc<dyn Geometric>,
}

impl SceneWorld {
    /// Create a SceneWorld from an already-built world geometry,
    /// with empty category lists (no importance sampling).
    pub fn from_world_without_importance_sampling(world: Arc<dyn Geometric>) -> Self {
        SceneWorld {
            world,
            emissive_list: Arc::new(List::from_vec(Vec::new())),
            transmissive_list: Arc::new(List::from_vec(Vec::new())),
            specular_list: Arc::new(List::from_vec(Vec::new())),
            virtual_list: Arc::new(List::from_vec(Vec::new())),
        }
    }

    pub fn from_geometrics(
        world: &Vec<Arc<dyn Geometric>>,
        world_virtual: &[Arc<dyn Geometric>],
        use_bvh: bool,
    ) -> Self {
        // separate bounded and unbounded geometrics — unbounded primitives
        // (e.g. Plane) have Aabb::UNIVERSE and would break BVH construction
        let mut bounded = Vec::new();
        let mut unbounded = Vec::new();
        for geometric in world {
            let bounding_box = geometric.bounding_box();
            if bounding_box.is_infinite() {
                unbounded.push(geometric.clone());
            } else {
                bounded.push(geometric.clone());
            }
        }

        let compiled_world: Arc<dyn Geometric> = {
            let bounded_list = List::from_vec(bounded);
            let bounded_compiled: Arc<dyn Geometric> =
                if use_bvh && !bounded_list.items().is_empty() {
                    Arc::new(Bvh::from_list(bounded_list))
                } else {
                    Arc::new(bounded_list)
                };

            if unbounded.is_empty() {
                bounded_compiled
            } else {
                // binary-tree style: List(BVH, List(unbounded...))
                let mut combined = List::new();
                combined.push(bounded_compiled);
                combined.push(Arc::new(List::from_vec(unbounded)));
                Arc::new(combined)
            }
        };

        let mut emissives = Vec::new();
        let mut transmissives = Vec::new();
        let mut speculars = Vec::new();

        for geometric in world {
            if geometric.is_emissive() {
                emissives.push(geometric.clone());
            }
            if geometric.is_transmissive() {
                transmissives.push(geometric.clone());
            }
            if geometric.is_specular() {
                speculars.push(geometric.clone());
            }
        }

        SceneWorld {
            world: compiled_world,

            emissive_list: Arc::new(List::from_vec(emissives)),
            transmissive_list: Arc::new(List::from_vec(transmissives)),
            specular_list: Arc::new(List::from_vec(speculars)),
            virtual_list: Arc::new(List::from_vec(world_virtual.to_owned())),
        }
    }
}
