use criterion::{black_box, criterion_group, criterion_main, BatchSize, Criterion};
use luxide::{
    geometry::{primitives::Sphere, Geometric, Point, Ray, RayHit, Vector},
    utils::Interval,
};
use rand::Rng;

fn random() -> (
    String,
    Box<dyn Fn() -> Ray>,
    Box<dyn Fn(Ray) -> Option<RayHit>>,
) {
    let s = Sphere::unit();

    let setup = || -> Ray {
        let origin = Point::new(0.0, 0.0, 2.0);
        let direction = Vector::random_in_unit_sphere();

        Ray::new(origin, direction, 0.0)
    };

    let ray_t = Interval::new(0.001, f64::INFINITY);
    let routine = move |ray| s.intersect(black_box(ray), ray_t);

    ("random".to_string(), Box::new(setup), Box::new(routine))
}

fn hit() -> (
    String,
    Box<dyn Fn() -> Ray>,
    Box<dyn Fn(Ray) -> Option<RayHit>>,
) {
    let s = Sphere::unit();

    let setup = || -> Ray {
        let mut rng = rand::thread_rng();

        let origin = Point::new(0.0, 0.0, 2.0);
        let target = Point::new(rng.gen_range(-0.8..0.8), rng.gen_range(-0.8..0.8), 0.0);
        let direction = origin.to(target).unit_vector();

        Ray::new(origin, direction, 0.0)
    };

    let ray_t = Interval::new(0.001, f64::INFINITY);
    let routine = move |ray| s.intersect(black_box(ray), ray_t);

    ("hit".to_string(), Box::new(setup), Box::new(routine))
}

fn hit_tangent() -> (
    String,
    Box<dyn Fn() -> Ray>,
    Box<dyn Fn(Ray) -> Option<RayHit>>,
) {
    let s = Sphere::unit();

    let setup = || -> Ray {
        let origin = Point::new(1.0, 0.0, 2.0);
        let target = Point::new(1.0, 0.0, 0.0);
        let direction = origin.to(target).unit_vector();

        Ray::new(origin, direction, 0.0)
    };

    let ray_t = Interval::new(0.001, f64::INFINITY);
    let routine = move |ray| s.intersect(black_box(ray), ray_t);

    (
        "hit_tangent".to_string(),
        Box::new(setup),
        Box::new(routine),
    )
}

fn miss() -> (
    String,
    Box<dyn Fn() -> Ray>,
    Box<dyn Fn(Ray) -> Option<RayHit>>,
) {
    let s = Sphere::unit();

    let setup = || -> Ray {
        let origin = Point::new(0.0, 0.0, 2.0);

        let new_target_fn = || origin + Vector::random_in_unit_sphere();
        let mut target = new_target_fn();
        while origin.to(target).angle(origin.to(Point::ZERO)).as_degrees() < 45.0 {
            target = new_target_fn();
        }
        let direction = origin.to(target).unit_vector();

        Ray::new(origin, direction, 0.0)
    };

    let ray_t = Interval::new(0.001, f64::INFINITY);
    let routine = move |ray| s.intersect(black_box(ray), ray_t);

    ("miss".to_string(), Box::new(setup), Box::new(routine))
}

fn sphere_intersect(c: &mut Criterion) {
    let cases = [random(), hit(), hit_tangent(), miss()];

    let mut group = c.benchmark_group("sphere_intersect");
    for (id, setup, routine) in cases {
        group.bench_function(id, |b| {
            b.iter_batched(setup.as_ref(), routine.as_ref(), BatchSize::SmallInput)
        });
    }
}

criterion_group!(benches, sphere_intersect);
criterion_main!(benches);
