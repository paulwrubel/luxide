use std::{fs, path::Path, rc::Rc};

use luxide::{
    camera::Camera,
    geometry::{
        compounds::{List, BVH},
        primitives::Sphere,
        Intersect, Point, Vector,
    },
    shading::{
        materials::{Dielectric, Lambertian, Scatter, Specular},
        textures::SolidColor,
        Color,
    },
};

const _SD: u32 = 720;
const _HD: u32 = 1280;
const _FULL_HD: u32 = 1920;
const _FOUR_K: u32 = 3840;

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
    let width = _FOUR_K;
    let samples_per_pixel = 500;
    let max_bounces = 50;

    let vertical_field_of_view_degrees = 30.0;
    let look_from = Point::new(13.0, 2.0, 3.0);
    let look_at = Point::new(0.0, 0.0, 0.0);
    let view_up = Vector::new(0.0, 1.0, 0.0);

    let defocus_angle_degrees = 0.06;
    let focus_distance = 10.0;

    // Materials
    let lambertian_grey: Rc<dyn Scatter> = Rc::new(Lambertian::new(Color::new(0.5, 0.5, 0.5)));
    let dielectric_glass: Rc<dyn Scatter> = Rc::new(Dielectric::new(1.5));
    let lambertian_brown: Rc<dyn Scatter> = Rc::new(Lambertian::new(Color::new(0.4, 0.2, 0.1)));
    let specular_amber: Rc<dyn Scatter> = Rc::new(Specular::new(Color::new(0.7, 0.6, 0.5), 0.0));

    // Primitives
    let mut world_list = List::new();

    // the ground
    world_list.push(Box::new(Sphere::new(
        Point::new(0.0, -100000.0, 0.0),
        100000.0,
        Rc::clone(&lambertian_grey),
    )));

    // random spheres
    let extents = 100;
    for x in -extents..extents {
        for z in -extents..extents {
            let center = Point::new(
                x as f64 + 0.9 * rand::random::<f64>(),
                0.2,
                z as f64 + 0.9 * rand::random::<f64>(),
            );

            if (center.to(&Point::new(4.0, 0.2, 0.0))).length() > 0.9 {
                let choose_mat = rand::random::<f64>();
                if choose_mat < 0.8 {
                    // lambertian
                    let albedo = Color::random() * Color::random();
                    let lambertian = Rc::new(Lambertian::new(albedo));
                    let center_2 = center + Vector::new(0.0, 0.5 * rand::random::<f64>(), 0.0);
                    world_list.push(Box::new(Sphere::new_in_motion(
                        center, center_2, 0.2, lambertian,
                    )));
                } else if choose_mat < 0.95 {
                    // specular
                    let albedo = Color::random_range(0.5, 1.0);
                    let fuzz = 0.5 * rand::random::<f64>();
                    let specular = Rc::new(Specular::new(albedo, fuzz));
                    world_list.push(Box::new(Sphere::new(center, 0.2, specular)));
                } else {
                    // dielectric
                    let dielectric = Rc::new(Dielectric::new(1.5));
                    world_list.push(Box::new(Sphere::new(center, 0.2, dielectric)));
                }
            }
        }
    }

    // large spheres
    world_list.push(Box::new(Sphere::new(
        Point::new(0.0, 1.0, 0.0),
        1.0,
        Rc::clone(&dielectric_glass),
    )));
    world_list.push(Box::new(Sphere::new(
        Point::new(-4.0, 1.0, 0.0),
        1.0,
        Rc::clone(&lambertian_brown),
    )));
    world_list.push(Box::new(Sphere::new(
        Point::new(4.0, 1.0, 0.0),
        1.0,
        Rc::clone(&specular_amber),
    )));

    // World
    let world: Box<dyn Intersect> = Box::new(BVH::from_list(world_list));
    // let world: Box<dyn Intersect> = Box::new(world_list);

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
