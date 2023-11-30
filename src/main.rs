use std::{
    collections::HashMap, fs, num::NonZeroUsize, path::Path, sync::Arc, thread, time::Instant,
};

use luxide::{
    camera::Camera,
    geometry::{
        compounds::{List, BVH},
        primitives::{Parallelogram, Sphere},
        Intersect, Point, Vector,
    },
    parameters::Parameters,
    scene::Scene,
    shading::{
        materials::{Dielectric, Lambertian, Material, Specular},
        textures::{Checker, Image8Bit, Noise, SolidColor},
        Color, Texture,
    },
    tracer::Tracer,
    utils::{self},
};
use noise::{Perlin, Turbulence};
use rand::Rng;
use time::OffsetDateTime;

const _SD: (u32, u32) = (640, 480);
const _HD: (u32, u32) = (1280, 720);
const _FULL_HD: (u32, u32) = (1920, 1080);
const _QUAD_HD: (u32, u32) = (2560, 1440);
const _4K: (u32, u32) = (3840, 2160);
const _8K: (u32, u32) = (7680, 4320);
const _16K: (u32, u32) = (15360, 8640);

const OUTPUT_DIR: &str = "./output";

fn main() -> std::io::Result<()> {
    println!("Starting Luxide...");

    let local_utc_offset = time::UtcOffset::current_local_offset().unwrap();

    let selected_scene_name = "cornell_box";

    println!("Assembling scenes...");
    let mut scenes = HashMap::new();
    scenes.insert("random_spheres", random_spheres());
    scenes.insert("two_spheres", two_spheres());
    scenes.insert("earth", earth());
    scenes.insert("two_perlin_spheres", two_perlin_spheres());
    scenes.insert("quads", quads());
    scenes.insert("simple_light", simple_light());
    scenes.insert("cornell_box", cornell_box());

    let scene = scenes.get_mut(selected_scene_name).unwrap();

    let now = OffsetDateTime::now_utc().to_offset(local_utc_offset);
    let formatted_timestamp = utils::get_formatted_timestamp_for(now);

    let sub_folder = format!("{selected_scene_name}_{formatted_timestamp}");

    let output_dir_string = format!("{OUTPUT_DIR}/{sub_folder}");
    let output_dir = Path::new(&output_dir_string);
    println!("Initializing output directory: {output_dir_string}");
    fs::create_dir_all(output_dir)?;

    let parameters = Parameters {
        output_dir,
        file_basename: selected_scene_name,
        file_ext: "png",
        image_dimensions: (1000, 1000),
        tile_dimensions: (10, 10),

        gamma_correction: 2.0,
        samples_per_round: 100,
        round_limit: None,
        max_bounces: 50,

        pixels_per_progress_update: 1000,
        progress_memory: 50,

        scene: &scene,
    };

    let thread_count = thread::available_parallelism()
        .unwrap_or(NonZeroUsize::new(24).unwrap())
        .get();

    let mut tracer = Tracer::new(thread_count, local_utc_offset);
    println!("Rendering scene \"{selected_scene_name}\" with {thread_count} threads...");
    let start = Instant::now();
    match tracer.render(&parameters, 2) {
        Ok(()) => {
            println!("Saved image!");
        }
        Err(e) => {
            println!("Failed to save image: {e}");
        }
    };
    let elapsed = start.elapsed();
    println!("Done in {}", utils::format_duration(elapsed));

    Ok(())
}

fn cornell_box() -> Scene {
    // Textures
    let solid_black: Arc<dyn Texture> = Arc::new(SolidColor::new(Color::BLACK));
    let solid_white: Arc<dyn Texture> = Arc::new(SolidColor::from_rgb(0.73, 0.73, 0.73));
    let solid_red: Arc<dyn Texture> = Arc::new(SolidColor::from_rgb(0.65, 0.05, 0.05));
    let solid_green: Arc<dyn Texture> = Arc::new(SolidColor::from_rgb(0.12, 0.45, 0.15));
    let solid_white_light: Arc<dyn Texture> = Arc::new(SolidColor::from_rgb(15.0, 15.0, 15.0));

    // Materials
    let lambertian_white: Arc<dyn Material> = Arc::new(Lambertian::new(
        Arc::clone(&solid_white),
        Arc::clone(&solid_black),
    ));
    let lambertian_red: Arc<dyn Material> = Arc::new(Lambertian::new(
        Arc::clone(&solid_red),
        Arc::clone(&solid_black),
    ));
    let lambertian_green: Arc<dyn Material> = Arc::new(Lambertian::new(
        Arc::clone(&solid_green),
        Arc::clone(&solid_black),
    ));
    let lambertian_white_light: Arc<dyn Material> = Arc::new(Lambertian::new(
        Arc::clone(&solid_black),
        Arc::clone(&solid_white_light),
    ));

    // Primitives
    let mut world = Box::new(List::new());
    // left wall (green)
    world.push(Box::new(Parallelogram::new(
        Point::new(0.0, 0.0, 0.0),
        Vector::new(0.0, 0.0, -1.0),
        Vector::new(0.0, 1.0, 0.0),
        true,
        Arc::clone(&lambertian_green),
    )));
    // right wall (red)
    world.push(Box::new(Parallelogram::new(
        Point::new(1.0, 0.0, -1.0),
        Vector::new(0.0, 0.0, 1.0),
        Vector::new(0.0, 1.0, 0.0),
        true,
        Arc::clone(&lambertian_red),
    )));
    // floor (white)
    world.push(Box::new(Parallelogram::new(
        Point::new(0.0, 0.0, 0.0),
        Vector::new(1.0, 0.0, 0.0),
        Vector::new(0.0, 0.0, -1.0),
        true,
        Arc::clone(&lambertian_white),
    )));
    // ceiling (white)
    world.push(Box::new(Parallelogram::new(
        Point::new(0.0, 1.0, -1.0),
        Vector::new(1.0, 0.0, 0.0),
        Vector::new(0.0, 0.0, 1.0),
        true,
        Arc::clone(&lambertian_white),
    )));
    // back wall (white)
    world.push(Box::new(Parallelogram::new(
        Point::new(0.0, 0.0, -1.0),
        Vector::new(1.0, 0.0, 0.0),
        Vector::new(0.0, 1.0, 0.0),
        true,
        Arc::clone(&lambertian_white),
    )));
    // ceiling light
    world.push(Box::new(Parallelogram::new(
        Point::new(0.38198, 0.99820, -0.59820),
        Vector::new(0.23423, 0.0, 0.0),
        Vector::new(0.0, 0.0, 0.18919),
        true,
        Arc::clone(&lambertian_white_light),
    )));

    // Camera
    let vertical_field_of_view_degrees = 40.0;
    let eye_location = Point::new(0.5, 0.5, 1.44144);
    let target_location = Point::new(0.5, 0.5, 0.0);
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

    Scene {
        camera,
        world,
        background_color: Color::BLACK,
    }
}

fn simple_light() -> Scene {
    // Textures
    let solid_black: Arc<dyn Texture> = Arc::new(SolidColor::new(Color::BLACK));
    let solid_white_light: Arc<dyn Texture> = Arc::new(SolidColor::new(Color::WHITE * 4.0));

    let input_fn = |p: Point| Point::from_vector(4.0 * p.0);
    // let output_fn = |n: f64, p: Point| 0.5 * (1.0 + (p.0.z + 10.0 * n).sin());
    let output_fn = |n: f64, p: Point| 0.5 * (1.0 + (p.0.z + 3.0 * n).sin());
    // let output_fn = |n: f64, p: Point| n;
    let noise_perlin =
        Turbulence::<_, Perlin>::new(Perlin::new(rand::thread_rng().gen_range(0..=u32::MAX)))
            // .set_roughness(7)
            // .set_frequency(1.0)
            // .set_power(2.0)
            ;
    let perlin_noise: Arc<dyn Texture> = Arc::new(
        Noise::new(noise_perlin)
            .map_input(input_fn)
            .map_output(output_fn),
    );

    // Materials
    let lambertian_perlin: Arc<dyn Material> = Arc::new(Lambertian::new(
        Arc::clone(&perlin_noise),
        Arc::clone(&solid_black),
    ));
    let lambertian_light: Arc<dyn Material> = Arc::new(Lambertian::new(
        Arc::clone(&solid_black),
        Arc::clone(&solid_white_light),
    ));

    // Primitives
    let mut world = Box::new(List::new());
    world.push(Box::new(Sphere::new(
        Point::new(0.0, -1000.0, 0.0),
        1000.0,
        Arc::clone(&lambertian_perlin),
    )));
    world.push(Box::new(Sphere::new(
        Point::new(0.0, 2.0, 0.0),
        2.0,
        Arc::clone(&lambertian_perlin),
    )));
    world.push(Box::new(Parallelogram::new(
        Point::new(3.0, 1.0, -2.0),
        Vector::new(2.0, 0.0, 0.0),
        Vector::new(0.0, 2.0, 0.0),
        true,
        Arc::clone(&lambertian_light),
    )));
    world.push(Box::new(Sphere::new(
        Point::new(0.0, 7.0, 0.0),
        2.0,
        Arc::clone(&lambertian_light),
    )));

    // Camera
    let vertical_field_of_view_degrees = 20.0;
    let eye_location = Point::new(26.0, 3.0, 6.0);
    let target_location = Point::new(0.0, 2.0, 0.0);
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

    Scene {
        camera,
        world,
        background_color: Color::BLACK,
    }
}

fn quads() -> Scene {
    // Textures
    let solid_black: Arc<dyn Texture> = Arc::new(SolidColor::new(Color::BLACK));
    let solid_red: Arc<dyn Texture> = Arc::new(SolidColor::new(Color::new(1.0, 0.2, 0.2)));
    let solid_green: Arc<dyn Texture> = Arc::new(SolidColor::new(Color::new(0.2, 1.0, 0.2)));
    let solid_blue: Arc<dyn Texture> = Arc::new(SolidColor::new(Color::new(0.2, 0.2, 1.0)));
    let solid_orange: Arc<dyn Texture> = Arc::new(SolidColor::new(Color::new(1.0, 0.5, 0.0)));
    let solid_teal: Arc<dyn Texture> = Arc::new(SolidColor::new(Color::new(0.2, 0.8, 0.8)));

    // Materials
    let lambertian_red: Arc<dyn Material> = Arc::new(Lambertian::new(
        Arc::clone(&solid_red),
        Arc::clone(&solid_black),
    ));
    let lambertian_green: Arc<dyn Material> = Arc::new(Lambertian::new(
        Arc::clone(&solid_green),
        Arc::clone(&solid_black),
    ));
    let lambertian_blue: Arc<dyn Material> = Arc::new(Lambertian::new(
        Arc::clone(&solid_blue),
        Arc::clone(&solid_black),
    ));
    let lambertian_orange: Arc<dyn Material> = Arc::new(Lambertian::new(
        Arc::clone(&solid_orange),
        Arc::clone(&solid_black),
    ));
    let lambertian_teal: Arc<dyn Material> = Arc::new(Lambertian::new(
        Arc::clone(&solid_teal),
        Arc::clone(&solid_black),
    ));

    // Primitives
    let is_culled = false;
    let mut world = Box::new(List::new());
    world.push(Box::new(Parallelogram::new(
        Point::new(-3.0, -2.0, 5.0),
        Vector::new(0.0, 0.0, -4.0),
        Vector::new(0.0, 4.0, 0.0),
        is_culled,
        Arc::clone(&lambertian_red),
    )));
    world.push(Box::new(Parallelogram::new(
        Point::new(-2.0, -2.0, 0.0),
        Vector::new(4.0, 0.0, 0.0),
        Vector::new(0.0, 4.0, 0.0),
        is_culled,
        Arc::clone(&lambertian_green),
    )));
    world.push(Box::new(Parallelogram::new(
        Point::new(3.0, -2.0, 1.0),
        Vector::new(0.0, 0.0, 4.0),
        Vector::new(0.0, 4.0, 0.0),
        is_culled,
        Arc::clone(&lambertian_blue),
    )));
    world.push(Box::new(Parallelogram::new(
        Point::new(-2.0, 3.0, 1.0),
        Vector::new(4.0, 0.0, 0.0),
        Vector::new(0.0, 0.0, 4.0),
        is_culled,
        Arc::clone(&lambertian_orange),
    )));
    world.push(Box::new(Parallelogram::new(
        Point::new(-2.0, -3.0, 5.0),
        Vector::new(4.0, 0.0, 0.0),
        Vector::new(0.0, 0.0, -4.0),
        is_culled,
        Arc::clone(&lambertian_teal),
    )));

    // Camera
    let vertical_field_of_view_degrees = 80.0;
    let eye_location = Point::new(0.0, 0.0, 9.0);
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

    Scene {
        camera,
        world,
        background_color: Color::new(0.7, 0.8, 1.0),
    }
}

fn two_perlin_spheres() -> Scene {
    // Textures
    let solid_black: Arc<dyn Texture> = Arc::new(SolidColor::new(Color::BLACK));

    let input_fn = |p: Point| Point::from_vector(4.0 * p.0);
    // let output_fn = |n: f64, p: Point| 0.5 * (1.0 + (p.0.z + 10.0 * n).sin());
    let output_fn = |n: f64, p: Point| 0.5 * (1.0 + (p.0.z + 2.0 * n).sin());
    // let output_fn = |n: f64, p: Point| n;
    let noise_perlin =
        Turbulence::<_, Perlin>::new(Perlin::new(rand::thread_rng().gen_range(0..=u32::MAX)))
            .set_roughness(7)
            .set_frequency(2.0)
            // .set_power(2.0)
            ;
    let perlin_noise: Arc<dyn Texture> = Arc::new(
        Noise::new(noise_perlin)
            .map_input(input_fn)
            .map_output(output_fn),
    );

    // Materials
    let lambertian_perlin: Arc<dyn Material> = Arc::new(Lambertian::new(
        Arc::clone(&perlin_noise),
        Arc::clone(&solid_black),
    ));

    // Primitives
    let mut world = Box::new(List::new());
    world.push(Box::new(Sphere::new(
        Point::new(0.0, -1000.0, 0.0),
        1000.0,
        Arc::clone(&lambertian_perlin),
    )));
    world.push(Box::new(Sphere::new(
        Point::new(0.0, 2.0, 0.0),
        2.0,
        Arc::clone(&lambertian_perlin),
    )));

    // Camera
    let vertical_field_of_view_degrees = 20.0;
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

    Scene {
        camera,
        world,
        background_color: Color::new(0.7, 0.8, 1.0),
    }
}

fn earth() -> Scene {
    // Textures
    let solid_black: Arc<dyn Texture> = Arc::new(SolidColor::new(Color::BLACK));
    let image_earth_day: Arc<dyn Texture> =
        Arc::new(Image8Bit::from_filename("./texture_images/8k_earth_daymap.jpg", 2.0).unwrap());
    // let image_earth_night: Arc<dyn Texture> =
    //     Arc::new(Image8Bit::from_filename("./texture_images/8k_earth_nightmap.jpg", 2.0).unwrap());
    let image_moon: Arc<dyn Texture> =
        Arc::new(Image8Bit::from_filename("./texture_images/8k_moon.jpg", 2.0).unwrap());
    // let image_stars_milky_way =
    //     Arc::new(Image8Bit::from_filename("./texture_images/8k_stars_milky_way.jpg", 2.0).unwrap());
    let solid_white: Arc<dyn Texture> = Arc::new(SolidColor::new(Color::WHITE));

    // Materials
    let lambertian_earth_day: Arc<dyn Material> = Arc::new(Lambertian::new(
        Arc::clone(&image_earth_day),
        Arc::clone(&solid_black),
    ));
    // let lambertian_earth_night: Arc<dyn Material> = Arc::new(Lambertian::new(image_earth_night));
    let lambertian_moon: Arc<dyn Material> = Arc::new(Lambertian::new(
        Arc::clone(&image_moon),
        Arc::clone(&solid_black),
    ));
    // let lambertian_stars_milky_way: Arc<dyn Material> =
    //     Arc::new(Lambertian::new(image_stars_milky_way));
    let dielectric_glass: Arc<dyn Material> = Arc::new(Dielectric::new(
        Arc::clone(&solid_white),
        Arc::clone(&solid_black),
        1.5,
    ));

    // Primitives
    let mut world = Box::new(List::new());
    world.push(Box::new(Sphere::new(
        Point::new(0.0, 0.0, 0.0),
        2.0,
        Arc::clone(&lambertian_earth_day),
    )));
    world.push(Box::new(Sphere::new(
        Point::new(-1.5, 0.0, 3.0),
        0.7,
        Arc::clone(&lambertian_moon),
    )));
    world.push(Box::new(Sphere::new(
        Point::new(-0.3, 0.0, 6.5),
        0.5,
        Arc::clone(&dielectric_glass),
    )));

    let world = Box::new(BVH::new(world.take_items()));

    // Camera
    let vertical_field_of_view_degrees = 30.0;
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

    Scene {
        camera,
        world,
        background_color: Color::new(0.7, 0.8, 1.0),
    }
}

fn two_spheres() -> Scene {
    // Materials
    let solid_black: Arc<dyn Texture> = Arc::new(SolidColor::new(Color::BLACK));
    let checker: Arc<dyn Texture> = Arc::new(Checker::from_colors(
        0.5,
        Color::new(0.2, 0.1, 0.1),
        Color::new(0.9, 0.9, 0.9),
    ));
    let lambertian_checker: Arc<dyn Material> = Arc::new(Lambertian::new(
        Arc::clone(&checker),
        Arc::clone(&solid_black),
    ));

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

    Scene {
        world,
        camera,
        background_color: Color::new(0.7, 0.8, 1.0),
    }
}

fn random_spheres() -> Scene {
    // Textures
    let solid_black: Arc<dyn Texture> = Arc::new(SolidColor::new(Color::BLACK));
    let solid_white: Arc<dyn Texture> = Arc::new(SolidColor::new(Color::WHITE));
    let solid_brown: Arc<dyn Texture> = Arc::new(SolidColor::new(Color::new(0.4, 0.2, 0.1)));
    let solid_amber: Arc<dyn Texture> = Arc::new(SolidColor::new(Color::new(0.7, 0.6, 0.5)));

    // Materials
    let checker: Arc<dyn Texture> = Arc::new(Checker::from_colors(
        0.32,
        Color::new(0.2, 0.3, 0.1),
        Color::new(0.9, 0.9, 0.9),
    ));
    let lambertian_checker: Arc<dyn Material> = Arc::new(Lambertian::new(
        Arc::clone(&checker),
        Arc::clone(&solid_black),
    ));
    let dielectric_glass: Arc<dyn Material> = Arc::new(Dielectric::new(
        Arc::clone(&solid_white),
        Arc::clone(&solid_black),
        1.5,
    ));
    let lambertian_brown: Arc<dyn Material> = Arc::new(Lambertian::new(
        Arc::clone(&solid_brown),
        Arc::clone(&solid_black),
    ));
    let specular_amber: Arc<dyn Material> = Arc::new(Specular::new(
        Arc::clone(&solid_amber),
        Arc::clone(&solid_black),
        0.0,
    ));

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
                    let reflectance = Color::random() * Color::random();
                    let reflectance = Arc::new(SolidColor::new(reflectance));
                    let lambertian =
                        Arc::new(Lambertian::new(reflectance, Arc::clone(&solid_black)));
                    let center_2 = center + Vector::new(0.0, 0.5 * rand::random::<f64>(), 0.0);
                    world_list.push(Box::new(Sphere::new_in_motion(
                        center, center_2, 0.2, lambertian,
                    )));
                } else if choose_mat < 0.95 {
                    // specular
                    let albedo = Color::random_range(0.5, 1.0);
                    let albedo: Arc<dyn Texture> = Arc::new(SolidColor::new(albedo));
                    let fuzz = 0.5 * rand::random::<f64>();
                    let specular = Arc::new(Specular::new(
                        Arc::clone(&albedo),
                        Arc::clone(&solid_black),
                        fuzz,
                    ));
                    world_list.push(Box::new(Sphere::new(center, 0.2, specular)));
                } else {
                    // dielectric
                    let albedo: Arc<dyn Texture> = Arc::new(SolidColor::new(Color::WHITE));
                    let dielectric = Arc::new(Dielectric::new(
                        Arc::clone(&albedo),
                        Arc::clone(&solid_black),
                        1.5,
                    ));
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

    Scene {
        world,
        camera,
        background_color: Color::new(0.7, 0.8, 1.0),
    }
}
