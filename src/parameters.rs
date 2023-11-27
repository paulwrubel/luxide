use crate::scene::Scene;

pub struct Parameters<'a, 'b> {
    pub filepath: &'a str,
    pub image_width: u32,
    pub image_height: u32,
    // pub aspect_ratio: f64,
    pub gamma_correction: f64,
    pub samples_per_pixel: u32,
    pub max_bounces: u32,
    pub use_parallel: bool,

    pub scene: &'b Scene,
}
