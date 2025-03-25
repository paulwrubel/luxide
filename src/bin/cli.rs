use std::{collections::HashMap, fs, num::NonZeroUsize, sync::Arc, thread, time::Instant};

use clap::Parser;
use luxide::{
    camera::Camera,
    deserialization::CompiledRenderData,
    geometry::{
        compounds::{AxisAlignedPBox, List, BVH},
        instances::{RotateYAxis, Translate},
        primitives::{Parallelogram, Sphere},
        volumes, Geometric, Point, Vector,
    },
    shading::{
        materials::{Dielectric, Lambertian, Material, Specular},
        textures::{Checker, Image8Bit, Noise, SolidColor},
        Color, Texture,
    },
    tracing::{Parameters, Scene, Tracer},
    utils::{self, Angle},
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

#[derive(Parser, Debug)]
#[command(version, about, long_about = None)]
struct Args {
    config_filename: Option<String>,
}

fn main() -> Result<(), String> {
    println!("Starting Luxide...");

    let args = Args::parse();

    if let Some(config_filename) = args.config_filename {
        println!("Using configuration file: {config_filename}");
        run(&config_filename)
    } else {
        println!("Using legacy configuration...");
        run_legacy()
    }
}

fn run(config_filename: &str) -> Result<(), String> {
    println!("Parsing configuration file...");
    let compiled_render_data = luxide::deserialization::parse_json_file(config_filename)?;
    let scene = &compiled_render_data.scene;

    let now = OffsetDateTime::now_utc();
    let formatted_timestamp = utils::get_formatted_timestamp_for(now);

    let sub_folder = format!("{}_{}", scene.name, formatted_timestamp);

    let output_dir = format!("{OUTPUT_DIR}/{sub_folder}");
    println!("Initializing output directory: {output_dir}");
    fs::create_dir_all(&output_dir).map_err(|err| err.to_string())?;

    let thread_count = thread::available_parallelism()
        .unwrap_or(NonZeroUsize::new(24).unwrap())
        .get();

    let mut tracer = Tracer::new(thread_count);
    println!(
        "Rendering scene \"{}\" with {} threads...",
        scene.name, thread_count
    );
    let start = Instant::now();
    match tracer.render(&compiled_render_data, 2) {
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

fn run_legacy() -> Result<(), String> {
    let selected_scene_name = "final_scene";

    println!("Assembling scenes...");
    let mut scenes = HashMap::new();
    scenes.insert("random_spheres", random_spheres());
    scenes.insert("two_spheres", two_spheres());
    scenes.insert("earth", earth());
    scenes.insert("two_perlin_spheres", two_perlin_spheres());
    scenes.insert("quads", quads());
    scenes.insert("simple_light", simple_light());
    scenes.insert("cornell_box", cornell_box());
    scenes.insert("final_scene", final_scene());

    let scene = scenes.get_mut(selected_scene_name).unwrap().clone();

    let now = OffsetDateTime::now_utc();
    let formatted_timestamp = utils::get_formatted_timestamp_for(now);
    let output_dir = format!(
        "{}/{}_{}",
        OUTPUT_DIR, selected_scene_name, formatted_timestamp
    );
    println!("Initializing output directory: {output_dir}");
    fs::create_dir_all(&output_dir).map_err(|err| err.to_string())?;

    let parameters = Parameters {
        output_dir: OUTPUT_DIR.to_string(),
        use_subdir: true,
        file_basename: selected_scene_name.to_string(),
        file_ext: "png".to_string(),
        image_dimensions: (6000, 6000),
        tile_dimensions: (10, 10),

        gamma_correction: 2.0,
        samples_per_round: 25,
        round_limit: None,
        max_bounces: 40,
        use_scaling_truncation: true,

        pixels_per_progress_update: 100000,
        progress_memory: 50,
    };

    let thread_count = thread::available_parallelism()
        .unwrap_or(NonZeroUsize::new(24).unwrap())
        .get();

    let mut tracer = Tracer::new(thread_count);
    println!("Rendering scene \"{selected_scene_name}\" with {thread_count} threads...");
    let start = Instant::now();
    match tracer.render(&CompiledRenderData { parameters, scene }, 2) {
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

fn final_scene() -> Scene {
    let mut rng = rand::thread_rng();

    // Textures
    let solid_black: Arc<dyn Texture> = Arc::new(SolidColor::BLACK);
    let solid_white: Arc<dyn Texture> = Arc::new(SolidColor::WHITE);
    let solid_light_grey: Arc<dyn Texture> = Arc::new(SolidColor::from_rgb(0.73, 0.73, 0.73));
    let solid_ground: Arc<dyn Texture> = Arc::new(SolidColor::from_rgb(0.48, 0.83, 0.53));
    let solid_white_light: Arc<dyn Texture> = Arc::new(SolidColor::from_rgb(7.0, 7.0, 7.0));
    let solid_red_motion_sphere: Arc<dyn Texture> = Arc::new(SolidColor::from_rgb(0.7, 0.3, 0.1));
    let solid_light_grey_frosted_metal: Arc<dyn Texture> =
        Arc::new(SolidColor::from_rgb(0.9, 0.9, 0.8));
    let solid_blue_glass: Arc<dyn Texture> = Arc::new(SolidColor::from_rgb(0.2, 0.4, 0.9));
    let image_earth_day: Arc<dyn Texture> =
        Arc::new(Image8Bit::from_filename("./texture_images/8k_earth_daymap.jpg", 2.0).unwrap());

    //perlin noise
    let input_fn = |p: Point| Point::from_vector(0.1 * p.0);
    // let output_fn = |n: f64, p: Point| 0.5 * (1.0 + (p.0.z + 10.0 * n).sin());
    let output_fn = |n: f64, p: Point| 0.5 * (1.0 + (p.0.z + 2.0 * n).sin());
    // let output_fn = |n: f64, p: Point| n;
    let noise_perlin = Turbulence::<_, Perlin>::new(Perlin::new(rng.gen_range(0..=u32::MAX)));
    let noise_perlin: Arc<dyn Texture> = Arc::new(
        Noise::new(noise_perlin)
            .map_input(input_fn)
            .map_output(output_fn),
    );

    // Materials
    let lambertian_white_pure: Arc<dyn Material> = Arc::new(Lambertian::new(
        Arc::clone(&solid_white),
        Arc::clone(&solid_black),
    ));
    let lambertian_light_grey: Arc<dyn Material> = Arc::new(Lambertian::new(
        Arc::clone(&solid_light_grey),
        Arc::clone(&solid_black),
    ));
    let lambertian_ground: Arc<dyn Material> = Arc::new(Lambertian::new(
        Arc::clone(&solid_ground),
        Arc::clone(&solid_black),
    ));
    let lambertian_light: Arc<dyn Material> = Arc::new(Lambertian::new(
        Arc::clone(&solid_black),
        Arc::clone(&solid_white_light),
    ));
    let lambertian_red_motion_sphere: Arc<dyn Material> = Arc::new(Lambertian::new(
        Arc::clone(&solid_red_motion_sphere),
        Arc::clone(&solid_black),
    ));
    let dielectric_glass: Arc<dyn Material> = Arc::new(Dielectric::new(
        Arc::clone(&solid_white),
        Arc::clone(&solid_black),
        1.5,
    ));
    let specular_frosted_metal: Arc<dyn Material> = Arc::new(Specular::new(
        Arc::clone(&solid_light_grey_frosted_metal),
        Arc::clone(&solid_black),
        1.0,
    ));
    let lambertian_earth_day: Arc<dyn Material> = Arc::new(Lambertian::new(
        Arc::clone(&image_earth_day),
        Arc::clone(&solid_black),
    ));
    let lambertian_perlin_noise: Arc<dyn Material> = Arc::new(Lambertian::new(
        Arc::clone(&noise_perlin),
        Arc::clone(&solid_black),
    ));

    // Primitives
    let mut world = List::new();

    let mut ground_boxes = List::new();
    let width = 100.0;
    for i in 0..20 {
        for j in 0..20 {
            let x0 = -1000.0 + i as f64 * width;
            let z0 = -1000.0 + j as f64 * width;
            let y0 = 0.0;

            let x1 = x0 + width;
            let y1 = rng.gen_range(1.0..101.0);
            let z1 = z0 + width;

            ground_boxes.push(Arc::new(AxisAlignedPBox::new(
                Point::new(x0, y0, z0),
                Point::new(x1, y1, z1),
                true,
                Arc::clone(&lambertian_ground),
            )))
        }
    }
    world.push(Arc::new(BVH::from_list(ground_boxes)));

    let light_panel = Arc::new(Parallelogram::new(
        Point::new(123.0, 554.0, 147.0),
        Vector::new(300.0, 0.0, 0.0),
        Vector::new(0.0, 0.0, 265.0),
        false,
        Arc::clone(&lambertian_light),
    ));
    world.push(light_panel);

    let center1 = Point::new(400.0, 400.0, 200.0);
    let center2 = center1 + Vector::new(30.0, 0.0, 0.0);
    let motion_sphere = Arc::new(Sphere::new_in_motion(
        center1,
        center2,
        50.0,
        Arc::clone(&lambertian_red_motion_sphere),
    ));
    world.push(motion_sphere);

    let clear_glass_sphere = Arc::new(Sphere::new(
        Point::new(260.0, 150.0, 45.0),
        50.0,
        Arc::clone(&dielectric_glass),
    ));
    world.push(clear_glass_sphere);

    let frosted_metal_sphere = Arc::new(Sphere::new(
        Point::new(0.0, 150.0, 145.0),
        50.0,
        Arc::clone(&specular_frosted_metal),
    ));
    world.push(frosted_metal_sphere);

    let blue_glass_sphere = Arc::new(Sphere::new(
        Point::new(360.0, 150.0, 145.0),
        70.0,
        Arc::clone(&dielectric_glass),
    ));
    let blue_glass_sphere_volume_boundary = blue_glass_sphere.clone();
    world.push(blue_glass_sphere);
    let blue_glass_sphere_volume = Arc::new(volumes::Constant::new(
        blue_glass_sphere_volume_boundary,
        0.2,
        Arc::clone(&solid_blue_glass),
    ));
    world.push(blue_glass_sphere_volume);

    let world_volume = Arc::new(Sphere::new(
        Point::new(0.0, 0.0, 0.0),
        0.0001,
        Arc::clone(&lambertian_white_pure),
    ));
    world.push(world_volume);

    let earth_sphere = Arc::new(Sphere::new(
        Point::new(400.0, 200.0, 400.0),
        100.0,
        Arc::clone(&lambertian_earth_day),
    ));
    world.push(earth_sphere);

    let perlin_noise_sphere = Arc::new(Sphere::new(
        Point::new(220.0, 280.0, 300.0),
        80.0,
        Arc::clone(&lambertian_perlin_noise),
    ));
    world.push(perlin_noise_sphere);

    let mut sphere_box = List::new();
    for _ in 0..1000 {
        sphere_box.push(Arc::new(Sphere::new(
            Point::from_vector(Vector::random_range(0.0, 165.0)),
            10.0,
            Arc::clone(&lambertian_light_grey),
        )))
    }
    let sphere_box = Arc::new(BVH::from_list(sphere_box));
    let sphere_box = Arc::new(RotateYAxis::new(
        sphere_box,
        Angle::Degrees(15.0),
        Point::ORIGIN,
    ));
    let sphere_box = Arc::new(Translate::new(
        sphere_box,
        Vector::new(-100.0, 270.0, 395.0),
    ));
    world.push(sphere_box);

    // create BVH from world
    let world = Arc::new(BVH::from_list(world));

    // Camera
    let vertical_field_of_view_degrees = 40.0;
    let eye_location = Point::new(478.0, 278.0, -600.0);
    let target_location = Point::new(278.0, 278.0, 0.0);
    let view_up = Vector::UP;

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
        name: "final_scene".to_string(),
        camera,
        world,
        background_color: Color::BLACK,
    }
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
    let mut world = List::new();
    // left wall (green)
    world.push(Arc::new(Parallelogram::new(
        Point::new(0.0, 0.0, 0.0),
        Vector::new(0.0, 0.0, -1.0),
        Vector::new(0.0, 1.0, 0.0),
        true,
        Arc::clone(&lambertian_green),
    )));
    // right wall (red)
    world.push(Arc::new(Parallelogram::new(
        Point::new(1.0, 0.0, -1.0),
        Vector::new(0.0, 0.0, 1.0),
        Vector::new(0.0, 1.0, 0.0),
        true,
        Arc::clone(&lambertian_red),
    )));
    // floor (white)
    world.push(Arc::new(Parallelogram::new(
        Point::new(0.0, 0.0, 0.0),
        Vector::new(1.0, 0.0, 0.0),
        Vector::new(0.0, 0.0, -1.0),
        true,
        Arc::clone(&lambertian_white),
    )));
    // ceiling (white)
    world.push(Arc::new(Parallelogram::new(
        Point::new(0.0, 1.0, -1.0),
        Vector::new(1.0, 0.0, 0.0),
        Vector::new(0.0, 0.0, 1.0),
        true,
        Arc::clone(&lambertian_white),
    )));
    // back wall (white)
    world.push(Arc::new(Parallelogram::new(
        Point::new(0.0, 0.0, -1.0),
        Vector::new(1.0, 0.0, 0.0),
        Vector::new(0.0, 1.0, 0.0),
        true,
        Arc::clone(&lambertian_white),
    )));
    // ceiling light
    world.push(Arc::new(Parallelogram::new(
        Point::new(1.0 - (343.0 / 555.0), 554.0 / 555.0, -332.0 / 555.0),
        Vector::new(130.0 / 555.0, 0.0, 0.0),
        Vector::new(0.0, 0.0, 105.0 / 555.0),
        false,
        Arc::clone(&lambertian_white_light),
    )));

    // far left box
    let far_left_box = Arc::new(AxisAlignedPBox::new(
        Point::ZERO,
        Point::ZERO + Vector::new(-165.0, 330.0, -165.0) / 555.0,
        false,
        Arc::clone(&lambertian_white),
    ));
    let far_left_box = Arc::new(RotateYAxis::new(
        far_left_box,
        Angle::Degrees(15.0),
        Point::ORIGIN,
    ));
    let far_left_box = Arc::new(Translate::new(
        far_left_box,
        Vector::new(1.0 - (265.0 / 555.0), 0.0, -295.0 / 555.0),
    ));
    let far_left_box = Arc::new(volumes::Constant::new(
        far_left_box,
        0.01 * 555.0,
        Arc::new(SolidColor::BLACK),
    ));
    world.push(far_left_box);

    // near right box
    let near_right_box = Arc::new(AxisAlignedPBox::new(
        Point::ZERO,
        Point::ZERO + Vector::new(-165.0, 165.0, -165.0) / 555.0,
        false,
        Arc::clone(&lambertian_white),
    ));
    let near_right_box = Arc::new(RotateYAxis::new(
        near_right_box,
        Angle::Degrees(-18.0),
        Point::ORIGIN,
    ));
    let near_right_box = Arc::new(Translate::new(
        near_right_box,
        Vector::new(1.0 - (130.0 / 555.0), 0.0, -65.0 / 555.0),
    ));
    let near_right_box = Arc::new(volumes::Constant::new(
        near_right_box,
        0.01 * 555.0,
        Arc::new(SolidColor::WHITE),
    ));
    world.push(near_right_box);

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
        name: "cornell_box".to_string(),
        camera,
        world: Arc::new(world),
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
    let mut world = List::new();
    world.push(Arc::new(Sphere::new(
        Point::new(0.0, -1000.0, 0.0),
        1000.0,
        Arc::clone(&lambertian_perlin),
    )));
    world.push(Arc::new(Sphere::new(
        Point::new(0.0, 2.0, 0.0),
        2.0,
        Arc::clone(&lambertian_perlin),
    )));
    world.push(Arc::new(Parallelogram::new(
        Point::new(3.0, 1.0, -2.0),
        Vector::new(2.0, 0.0, 0.0),
        Vector::new(0.0, 2.0, 0.0),
        true,
        Arc::clone(&lambertian_light),
    )));
    world.push(Arc::new(Sphere::new(
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
        name: "simple_light".to_string(),
        camera,
        world: Arc::new(world),
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
    let mut world = List::new();
    world.push(Arc::new(Parallelogram::new(
        Point::new(-3.0, -2.0, 5.0),
        Vector::new(0.0, 0.0, -4.0),
        Vector::new(0.0, 4.0, 0.0),
        is_culled,
        Arc::clone(&lambertian_red),
    )));
    world.push(Arc::new(Parallelogram::new(
        Point::new(-2.0, -2.0, 0.0),
        Vector::new(4.0, 0.0, 0.0),
        Vector::new(0.0, 4.0, 0.0),
        is_culled,
        Arc::clone(&lambertian_green),
    )));
    world.push(Arc::new(Parallelogram::new(
        Point::new(3.0, -2.0, 1.0),
        Vector::new(0.0, 0.0, 4.0),
        Vector::new(0.0, 4.0, 0.0),
        is_culled,
        Arc::clone(&lambertian_blue),
    )));
    world.push(Arc::new(Parallelogram::new(
        Point::new(-2.0, 3.0, 1.0),
        Vector::new(4.0, 0.0, 0.0),
        Vector::new(0.0, 0.0, 4.0),
        is_culled,
        Arc::clone(&lambertian_orange),
    )));
    world.push(Arc::new(Parallelogram::new(
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
        name: "quads".to_string(),
        camera,
        world: Arc::new(world),
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
    let mut world = List::new();
    world.push(Arc::new(Sphere::new(
        Point::new(0.0, -1000.0, 0.0),
        1000.0,
        Arc::clone(&lambertian_perlin),
    )));
    world.push(Arc::new(Sphere::new(
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
        name: "two_perlin_spheres".to_string(),
        camera,
        world: Arc::new(world),
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
    let mut world = List::new();
    world.push(Arc::new(Sphere::new(
        Point::new(0.0, 0.0, 0.0),
        2.0,
        Arc::clone(&lambertian_earth_day),
    )));
    world.push(Arc::new(Sphere::new(
        Point::new(-1.5, 0.0, 3.0),
        0.7,
        Arc::clone(&lambertian_moon),
    )));
    world.push(Arc::new(Sphere::new(
        Point::new(-0.3, 0.0, 6.5),
        0.5,
        Arc::clone(&dielectric_glass),
    )));

    let world = BVH::new(world.take_items());

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
        name: "earth".to_string(),
        camera,
        world: Arc::new(world),
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
    let mut world = List::new();
    world.push(Arc::new(Sphere::new(
        Point::new(0.0, -10.0, 0.0),
        10.0,
        Arc::clone(&lambertian_checker),
    )));
    world.push(Arc::new(Sphere::new(
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
        name: "two_spheres".to_string(),
        world: Arc::new(world),
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
    world_list.push(Arc::new(Sphere::new(
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
                    world_list.push(Arc::new(Sphere::new_in_motion(
                        center, center_2, 0.2, lambertian,
                    )));
                } else if choose_mat < 0.95 {
                    // specular
                    let albedo = Color::random_range(0.5, 1.0);
                    let albedo: Arc<dyn Texture> = Arc::new(SolidColor::new(albedo));
                    let roughness = 0.5 * rand::random::<f64>();
                    let specular = Arc::new(Specular::new(
                        Arc::clone(&albedo),
                        Arc::clone(&solid_black),
                        roughness,
                    ));
                    world_list.push(Arc::new(Sphere::new(center, 0.2, specular)));
                } else {
                    // dielectric
                    let albedo: Arc<dyn Texture> = Arc::new(SolidColor::new(Color::WHITE));
                    let dielectric = Arc::new(Dielectric::new(
                        Arc::clone(&albedo),
                        Arc::clone(&solid_black),
                        1.5,
                    ));
                    world_list.push(Arc::new(Sphere::new(center, 0.2, dielectric)));
                }
            }
        }
    }

    // large spheres
    world_list.push(Arc::new(Sphere::new(
        Point::new(0.0, 1.0, 0.0),
        1.0,
        Arc::clone(&dielectric_glass),
    )));
    world_list.push(Arc::new(Sphere::new(
        Point::new(-4.0, 1.0, 0.0),
        1.0,
        Arc::clone(&lambertian_brown),
    )));
    world_list.push(Arc::new(Sphere::new(
        Point::new(4.0, 1.0, 0.0),
        1.0,
        Arc::clone(&specular_amber),
    )));

    // World
    let world: Arc<dyn Geometric> = Arc::new(BVH::from_list(world_list));
    // let world: Arc<dyn Intersect> = Arc::new(world_list);

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
        name: "random_spheres".to_string(),
        world,
        camera,
        background_color: Color::new(0.7, 0.8, 1.0),
    }
}
