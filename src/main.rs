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
    let width = 400;
    let samples_per_pixel = 100;
    let max_bounces = 50;

    // Materials
    let lambertian_ground: Rc<dyn Scatter> = Rc::new(Lambertian::new(Color::new(0.8, 0.8, 0.0)));
    let lambertian_center: Rc<dyn Scatter> = Rc::new(Lambertian::new(Color::new(0.7, 0.3, 0.3)));
    let metal_left: Rc<dyn Scatter> = Rc::new(Metal::new(Color::new(0.8, 0.8, 0.8), 0.3));
    let metal_right: Rc<dyn Scatter> = Rc::new(Metal::new(Color::new(0.8, 0.6, 0.2), 1.0));

    // Primitives
    let ground_sphere = Box::new(Sphere::new(
        Point::new(0.0, -100.5, -1.0),
        100.0,
        Rc::clone(&lambertian_ground),
    ));
    let center_sphere = Box::new(Sphere::new(
        Point::new(0.0, 0.0, -1.0),
        0.5,
        Rc::clone(&lambertian_center),
    ));
    let left_sphere = Box::new(Sphere::new(
        Point::new(-1.0, 0.0, -1.0),
        0.5,
        Rc::clone(&metal_left),
    ));
    let right_sphere = Box::new(Sphere::new(
        Point::new(1.0, 0.0, -1.0),
        0.5,
        Rc::clone(&metal_right),
    ));

    // World
    let world: Box<dyn Hit> = Box::new(List::from_vec(vec![
        ground_sphere,
        center_sphere,
        left_sphere,
        right_sphere,
    ]));

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
