use std::sync::Arc;

use crate::{
    camera::Camera,
    geometry::{
        Geometric,
        compounds::{Bvh, List},
    },
    shading::Color,
};

#[derive(Clone)]
pub struct Scene {
    pub world: SceneWorld,

    pub camera: Camera,
    pub background_color: Color,
}

#[derive(Clone)]
pub struct SceneWorld {
    pub world: Arc<dyn Geometric>,

    pub emissives: Vec<Arc<dyn Geometric>>,
    // pub transmissives: Arc<dyn Geometric>,
    // pub speculars: Arc<dyn Geometric>,
}

impl SceneWorld {
    pub fn from_geometrics(geometrics: &Vec<Arc<dyn Geometric>>, use_bvh: bool) -> Self {
        let list = List::from_vec(geometrics.clone());
        let world: Arc<dyn Geometric> = if use_bvh {
            Arc::new(Bvh::from_list(list))
        } else {
            Arc::new(list)
        };

        let mut emissives = Vec::new();
        // let transmissives = Vec::new();
        // let speculars = Vec::new();

        for geometric in geometrics {
            if geometric.is_emissive() {
                emissives.push(geometric.clone());
            }
            // if geometric.is_transmissive() {
            //     transmissives.push(geometric.clone());
            // }
            // if geometric.is_specular() {
            //     speculars.push(geometric.clone());
            // }
        }

        SceneWorld {
            world,
            emissives,
            // transmissives,
            // speculars,
        }
    }
}
