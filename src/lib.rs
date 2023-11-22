// pub use geometry::primitives::{Hit, List, Sphere};
// pub use geometry::{Point, Ray, Vector};
// pub use image::{ImageBuffer, ImageError, Rgb};
// pub use shading::Color;
// pub use utils::Interval;

pub mod camera;
pub mod geometry;
pub mod shading;
pub mod utils;

// pub struct Image(ImageBuffer<Rgb<u8>, Vec<u8>>);

// impl Image {
//     pub fn generate(width: u32, height: u32) -> Self {
//     }
//     pub fn save(&self, filename: &Path) -> Result<(), ImageError> {
//         self.0.save(filename)?;
//         Ok(())
//     }
// }
