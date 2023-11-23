use std::{fs, path::Path, rc::Rc};

use luxide::{
    camera::Camera,
    geometry::{
        primitives::{Hit, List, Sphere},
        Point,
    },
    shading::{
        materials::{Lambertian, Metal, Scatter},
        Color,
    },
};

const OUTPUT_DIR: &str = "./output";

fn main() -> std::io::Result<()> {
    fs::create_dir_all(OUTPUT_DIR)?;
    let mut file_index = 0;
    let mut filepath;
    loop {
        filepath = format!("{OUTPUT_DIR}/image_{file_index}.png");
        match Path::new(&filepath).try_exists() {
            Ok(false) => break,
            Ok(true) => {
                file_index += 1;
            }
            Err(e) => return Err(e),
        }
    }

    let aspect_ratio = 16.0 / 9.0;
    let width = 1280;
    let samples_per_pixel = 10;
    let max_bounces = 500;

    // Materials
    let lambertian_light_grey: Rc<dyn Scatter> =
        Rc::new(Lambertian::new(Color::new(0.8, 0.8, 0.8)));
    let lambertian_red: Rc<dyn Scatter> = Rc::new(Lambertian::new(Color::new(0.9, 0.1, 0.1)));
    let metal_white: Rc<dyn Scatter> = Rc::new(Metal::new(Color::WHITE));

    // Primitives
    let ground_sphere = Box::new(Sphere::new(
        Point::new(0.0, -100.5, -1.0),
        100.0,
        Rc::clone(&lambertian_light_grey),
    ));
    let subject_sphere = Box::new(Sphere::new(
        Point::new(0.0, 0.0, -1.0),
        0.5,
        Rc::clone(&metal_white),
    ));

    // World
    let world: Box<dyn Hit> = Box::new(List::from_vec(vec![ground_sphere, subject_sphere]));

    let mut camera = Camera::new(aspect_ratio, width, samples_per_pixel, max_bounces);
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
