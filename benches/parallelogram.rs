use criterion::{black_box, criterion_group, criterion_main, BatchSize, Criterion};
use luxide::{
    geometry::{primitives::Parallelogram, Geometric, Point, Ray, RayHit, Vector},
    utils::Interval,
};
use rand::{rngs::ThreadRng, Rng};

fn random() -> (
    String,
    Box<dyn Fn() -> Ray>,
    Box<dyn Fn(Ray) -> Option<RayHit>>,
) {
    let p = Parallelogram::unit();

    let setup = || -> Ray {
        let origin = Point::new(0.0, 0.0, 1.0);
        let direction = Vector::random_in_unit_sphere();

        Ray::new(origin, direction, 0.0)
    };

    let ray_t = Interval::new(0.001, f64::INFINITY);
    let routine = move |ray| p.intersect(black_box(ray), ray_t);

    ("random".to_string(), Box::new(setup), Box::new(routine))
}

fn hit() -> (
    String,
    Box<dyn Fn() -> Ray>,
    Box<dyn Fn(Ray) -> Option<RayHit>>,
) {
    let p = Parallelogram::unit();

    let setup = || -> Ray {
        let mut rng = rand::thread_rng();

        let origin = Point::new(0.0, 0.0, 1.0);
        let target = Point::new(rng.gen_range(-0.5..0.5), rng.gen_range(-0.5..0.5), 0.0);
        let direction = origin.to(target).unit_vector();

        Ray::new(origin, direction, 0.0)
    };

    let ray_t = Interval::new(0.001, f64::INFINITY);
    let routine = move |ray| p.intersect(black_box(ray), ray_t);

    ("hit".to_string(), Box::new(setup), Box::new(routine))
}

fn miss_offset() -> (
    String,
    Box<dyn Fn() -> Ray>,
    Box<dyn Fn(Ray) -> Option<RayHit>>,
) {
    let p = Parallelogram::unit();

    let setup = || -> Ray {
        let origin = Point::new(0.0, 0.0, 1.0);

        let x_interval = Interval::new(-0.1, 1.1);
        let y_interval = Interval::new(-0.1, 1.1);
        let new_target_fn = |mut rng: ThreadRng| {
            Point::new(rng.gen_range(-2.5..2.5), rng.gen_range(-2.5..2.5), 0.0)
        };
        let mut target = new_target_fn(rand::thread_rng());
        while x_interval.contains_excluding(target.0.x) && y_interval.contains_excluding(target.0.y)
        {
            target = new_target_fn(rand::thread_rng());
        }
        let direction = origin.to(target).unit_vector();

        Ray::new(origin, direction, 0.0)
    };

    let ray_t = Interval::new(0.001, f64::INFINITY);
    let routine = move |ray| p.intersect(black_box(ray), ray_t);

    (
        "miss_offset".to_string(),
        Box::new(setup),
        Box::new(routine),
    )
}

fn miss_plane() -> (
    String,
    Box<dyn Fn() -> Ray>,
    Box<dyn Fn(Ray) -> Option<RayHit>>,
) {
    let p = Parallelogram::unit();

    let setup = || -> Ray {
        let mut rng = rand::thread_rng();

        let origin = Point::new(0.5, 0.5, 1.0);
        let target = Point::new(rng.gen_range(-0.5..0.5), rng.gen_range(-0.5..0.5), 2.0);
        let direction = origin.to(target).unit_vector();

        Ray::new(origin, direction, 0.0)
    };

    let ray_t = Interval::new(0.001, f64::INFINITY);
    let routine = move |ray| p.intersect(black_box(ray), ray_t);

    ("miss_plane".to_string(), Box::new(setup), Box::new(routine))
}

fn miss_culled() -> (
    String,
    Box<dyn Fn() -> Ray>,
    Box<dyn Fn(Ray) -> Option<RayHit>>,
) {
    let p = Parallelogram::unit();

    let setup = || -> Ray {
        let mut rng = rand::thread_rng();

        let origin = Point::new(0.0, 0.0, -1.0);
        let target = Point::new(rng.gen_range(-0.5..0.5), rng.gen_range(-0.5..0.5), 0.0);
        let direction = origin.to(target).unit_vector();

        Ray::new(origin, direction, 0.0)
    };

    let ray_t = Interval::new(0.001, f64::INFINITY);
    let routine = move |ray| p.intersect(black_box(ray), ray_t);

    (
        "miss_culled".to_string(),
        Box::new(setup),
        Box::new(routine),
    )
}

fn parallelogram_intersect(c: &mut Criterion) {
    let cases = [random(), hit(), miss_offset(), miss_plane(), miss_culled()];

    let mut group = c.benchmark_group("parallelogram_intersect");
    for (id, setup, routine) in cases {
        group.bench_function(id, |b| {
            b.iter_batched(setup.as_ref(), routine.as_ref(), BatchSize::SmallInput)
        });
    }
}

criterion_group!(benches, parallelogram_intersect);
criterion_main!(benches);
