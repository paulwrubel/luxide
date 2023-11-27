use std::{collections::HashMap, fs, path::Path, sync::Arc};

use luxide::{
    camera::Camera,
    geometry::{
        compounds::{List, BVH},
        instances::ReverseNormals,
        primitives::Sphere,
        Intersect, Point, Vector,
    },
    parameters::{self, Parameters},
    scene::Scene,
    shading::{
        materials::{Dielectric, Lambertian, Scatter, Specular},
        textures::{Checker, Image8Bit, SolidColor},
        Color, Texture,
    },
    tracer::Tracer,
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

    let selected_scene_name = "earth";

    let mut scenes = HashMap::new();
    scenes.insert("random_spheres", random_spheres());
    scenes.insert("two_spheres", two_spheres());
    scenes.insert("earth", earth());

    let scene = scenes.get_mut(selected_scene_name).unwrap();

    let parameters = Parameters {
        filepath: &filepath,
        image_width: 400,
        image_height: 400,
        gamma_correction: 2.0,
        samples_per_pixel: 100,
        max_bounces: 50,
        use_parallel: true,

        scene: &scene,
    };

    let mut tracer = Tracer::new();
    match tracer.render(&parameters) {
        Ok(()) => {
            println!("Saved image to {filepath}");
        }
        Err(e) => {
            println!("Failed to save image: {e}");
        }
    };

    Ok(())
}

fn earth() -> Scene {
    // Textures
    let image_earth_day: Arc<dyn Texture> =
        Arc::new(Image8Bit::from_filename("./texture_images/8k_earth_daymap.jpg", 2.0).unwrap());
    // let image_earth_night: Arc<dyn Texture> =
    //     Arc::new(Image8Bit::from_filename("./texture_images/8k_earth_nightmap.jpg", 2.0).unwrap());
    let image_moon: Arc<dyn Texture> =
        Arc::new(Image8Bit::from_filename("./texture_images/8k_moon.jpg", 2.0).unwrap());
    // let image_stars_milky_way =
    //     Arc::new(Image8Bit::from_filename("./texture_images/8k_stars_milky_way.jpg", 2.0).unwrap());
    let solid_white = Arc::new(SolidColor::new(Color::WHITE));

    // Materials
    let lambertian_earth_day: Arc<dyn Scatter> = Arc::new(Lambertian::new(image_earth_day));
    // let lambertian_earth_night: Arc<dyn Scatter> = Arc::new(Lambertian::new(image_earth_night));
    let lambertian_moon: Arc<dyn Scatter> = Arc::new(Lambertian::new(image_moon));
    // let lambertian_stars_milky_way: Arc<dyn Scatter> =
    //     Arc::new(Lambertian::new(image_stars_milky_way));
    let dielectric_glass: Arc<dyn Scatter> = Arc::new(Dielectric::new(solid_white, 1.5));

    // Primitives
    let mut world = Box::new(List::new());
    world.push(Box::new(Sphere::new(
        Point::new(0.0, 0.0, 0.0),
        2.0,
        Arc::clone(&lambertian_earth_day),
    )));
    world.push(Box::new(Sphere::new(
        Point::new(0.0, 0.0, 0.0),
        2.5,
        Arc::clone(&dielectric_glass),
    )));
    world.push(Box::new(Sphere::new(
        Point::new(-3.0, 0.0, -4.0),
        0.7,
        Arc::clone(&lambertian_moon),
    )));

    let world = Box::new(BVH::new(world.take_items()));

    // Camera
    let vertical_field_of_view_degrees = 40.0;
    let eye_location = Point::new(0.0, 0.0, 12.0);
    let target_location = Point::new(0.0, 0.0, 0.0);
    let view_up = Vector::new(0.0, 1.0, 0.0);

    let defocus_angle_degrees = 0.0;
    let focus_distance = 1.0;

    let camera = Camera::new(
        vertical_field_of_view_degrees,
        eye_location,
        target_location,
        view_up,
        defocus_angle_degrees,
        focus_distance,
    );

    Scene { camera, world }
}

fn two_spheres() -> Scene {
    // Materials
    let checker: Arc<dyn Texture> = Arc::new(Checker::from_colors(
        0.5,
        Color::new(0.2, 0.1, 0.1),
        Color::new(0.9, 0.9, 0.9),
    ));
    let lambertian_checker: Arc<dyn Scatter> = Arc::new(Lambertian::new(checker));

    // Primitives
    let mut world = Box::new(List::new());
    world.push(Box::new(Sphere::new(
        Point::new(0.0, -10.0, 0.0),
        10.0,
        Arc::clone(&lambertian_checker),
    )));
    world.push(Box::new(Sphere::new(
        Point::new(0.0, 10.0, 0.0),
        10.0,
        Arc::clone(&lambertian_checker),
    )));

    // Camera
    let vertical_field_of_view_degrees = 40.0;
    let eye_location = Point::new(13.0, 2.0, 3.0);
    let target_location = Point::new(0.0, 0.0, 0.0);
    let view_up = Vector::new(0.0, 1.0, 0.0);

    let defocus_angle_degrees = 0.0;
    let focus_distance = 1.0;

    let camera = Camera::new(
        vertical_field_of_view_degrees,
        eye_location,
        target_location,
        view_up,
        defocus_angle_degrees,
        focus_distance,
    );

    Scene { world, camera }
}

fn random_spheres() -> Scene {
    // Textures
    let solid_white = Arc::new(SolidColor::new(Color::WHITE));
    let solid_brown = Arc::new(SolidColor::new(Color::new(0.4, 0.2, 0.1)));
    let solid_amber = Arc::new(SolidColor::new(Color::new(0.7, 0.6, 0.5)));

    // Materials
    let checker: Arc<dyn Texture> = Arc::new(Checker::from_colors(
        0.32,
        Color::new(0.2, 0.3, 0.1),
        Color::new(0.9, 0.9, 0.9),
    ));
    let lambertian_checker: Arc<dyn Scatter> = Arc::new(Lambertian::new(checker));
    let dielectric_glass: Arc<dyn Scatter> = Arc::new(Dielectric::new(solid_white, 1.5));
    let lambertian_brown: Arc<dyn Scatter> = Arc::new(Lambertian::new(solid_brown));
    let specular_amber: Arc<dyn Scatter> = Arc::new(Specular::new(solid_amber, 0.0));

    // Primitives
    let mut world_list = List::new();

    // the ground
    world_list.push(Box::new(Sphere::new(
        Point::new(0.0, -100000.0, 0.0),
        100000.0,
        Arc::clone(&lambertian_checker),
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

            if (center.to(Point::new(4.0, 0.2, 0.0))).length() > 0.9 {
                let choose_mat = rand::random::<f64>();
                if choose_mat < 0.8 {
                    // lambertian
                    let albedo = Color::random() * Color::random();
                    let albedo = Arc::new(SolidColor::new(albedo));
                    let lambertian = Arc::new(Lambertian::new(albedo));
                    let center_2 = center + Vector::new(0.0, 0.5 * rand::random::<f64>(), 0.0);
                    world_list.push(Box::new(Sphere::new_in_motion(
                        center, center_2, 0.2, lambertian,
                    )));
                } else if choose_mat < 0.95 {
                    // specular
                    let albedo = Color::random_range(0.5, 1.0);
                    let albedo = Arc::new(SolidColor::new(albedo));
                    let fuzz = 0.5 * rand::random::<f64>();
                    let specular = Arc::new(Specular::new(albedo, fuzz));
                    world_list.push(Box::new(Sphere::new(center, 0.2, specular)));
                } else {
                    // dielectric
                    let albedo = Arc::new(SolidColor::new(Color::WHITE));
                    let dielectric = Arc::new(Dielectric::new(albedo, 1.5));
                    world_list.push(Box::new(Sphere::new(center, 0.2, dielectric)));
                }
            }
        }
    }

    // large spheres
    world_list.push(Box::new(Sphere::new(
        Point::new(0.0, 1.0, 0.0),
        1.0,
        Arc::clone(&dielectric_glass),
    )));
    world_list.push(Box::new(Sphere::new(
        Point::new(-4.0, 1.0, 0.0),
        1.0,
        Arc::clone(&lambertian_brown),
    )));
    world_list.push(Box::new(Sphere::new(
        Point::new(4.0, 1.0, 0.0),
        1.0,
        Arc::clone(&specular_amber),
    )));

    // World
    let world: Box<dyn Intersect> = Box::new(BVH::from_list(world_list));
    // let world: Box<dyn Intersect> = Box::new(world_list);

    // Camera
    let vertical_field_of_view_degrees = 20.0;
    let eye_location = Point::new(13.0, 2.0, 3.0);
    let target_location = Point::new(0.0, 0.0, 0.0);
    let view_up = Vector::new(0.0, 1.0, 0.0);

    let defocus_angle_degrees = 0.06;
    let focus_distance = 10.0;

    let camera = Camera::new(
        vertical_field_of_view_degrees,
        eye_location,
        target_location,
        view_up,
        defocus_angle_degrees,
        focus_distance,
    );

    Scene { world, camera }
}
