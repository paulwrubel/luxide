use std::{fs, path::Path};

use image::{buffer::ConvertBuffer, ImageBuffer, Rgb};
use luxide::{
    camera::Camera,
    geometry::{
        primitives::{Hit, List, Sphere},
        Point,
    },
};

const OUTPUT_DIR: &str = "./output";

fn main() -> std::io::Result<()> {
    fs::create_dir_all(OUTPUT_DIR)?;
    let mut file_index = 0;
    let mut filepath;
    loop {
        filepath = format!("{OUTPUT_DIR}/image_{file_index}.ppm");
        match Path::new(&filepath).try_exists() {
            Ok(false) => break,
            Ok(true) => {
                file_index += 1;
            }
            Err(e) => return Err(e),
        }
    }

    let aspect_ratio = 16.0 / 9.0;
    let width = 400;
    let samples_per_pixel = 100;

    // Primitives
    let world: Box<dyn Hit> = Box::new(List::from_vec(vec![
        Box::new(Sphere::new(Point::new(0.0, 0.0, -1.0), 0.5)),
        Box::new(Sphere::new(Point::new(0.0, -100.5, -1.0), 100.0)),
    ]));

    let mut camera = Camera::new(aspect_ratio, width, samples_per_pixel);
    let image = camera.render(world.as_ref());

    match image.save(&Path::new(&filepath)) {
        Ok(()) => {
            println!("Saved image to {filepath}");
        }
        Err(e) => {
            println!("Failed to save image: {e}");
        }
    }

    Ok(())
}
