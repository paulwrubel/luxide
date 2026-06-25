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
        let list = List::from_vec(world.clone());
        let compiled_world: Arc<dyn Geometric> = if use_bvh {
            Arc::new(Bvh::from_list(list))
        } else {
            Arc::new(list)
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
