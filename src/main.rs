use std::{f64::consts::PI, fs, path::Path, rc::Rc};

use luxide::{
    camera::Camera,
    geometry::{
        primitives::{Hit, List, Sphere},
        Point, Vector,
    },
    shading::{
        materials::{Dielectric, Lambertian, Scatter, Specular},
        Color,
    },
};

const SD: u32 = 720;
const HD: u32 = 1280;
const FULL_HD: u32 = 1920;
const FOUR_K: u32 = 3840;

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
    let width = FULL_HD;
    let samples_per_pixel = 250;
    let max_bounces = 50;

    let vertical_field_of_view_degrees = 20.0;
    let look_from = Point::new(-2.0, 2.0, 1.0);
    let look_at = Point::new(0.0, 0.0, -1.0);
    let view_up = Vector::new(0.0, 1.0, 0.0);

    let defocus_angle_degrees = 2.0;
    let focus_distance = 3.4;

    // Materials
    let lambertian_grey: Rc<dyn Scatter> = Rc::new(Lambertian::new(Color::new(0.5, 0.5, 0.5)));

    // Primitives
    let ground_sphere = Box::new(Sphere::new(
        Point::new(0.0, -100.5, -1.0),
        100.0,
        Rc::clone(&lambertian_light_green),
    ));
    let center_sphere = Box::new(Sphere::new(
        Point::new(0.0, 0.0, -1.0),
        0.5,
        Rc::clone(&lambertian_navy_blue),
    ));
    let left_sphere_outer = Box::new(Sphere::new(
        Point::new(-1.0, 0.0, -1.0),
        0.5,
        Rc::clone(&dielectric_glass),
    ));
    let left_sphere_inner = Box::new(Sphere::new(
        Point::new(-1.0, 0.0, -1.0),
        -0.4,
        Rc::clone(&dielectric_glass),
    ));
    let right_sphere = Box::new(Sphere::new(
        Point::new(1.0, 0.0, -1.0),
        0.5,
        Rc::clone(&specular_bronze),
    ));

    // World
    let world: Box<dyn Hit> = Box::new(List::from_vec(vec![
        ground_sphere,
        center_sphere,
        left_sphere_outer,
        left_sphere_inner,
        right_sphere,
    ]));

    let mut camera = Camera::new(
        aspect_ratio,
        width,
        samples_per_pixel,
        max_bounces,
        vertical_field_of_view_degrees,
        look_from,
        look_at,
        view_up,
        defocus_angle_degrees,
        focus_distance,
    );
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
