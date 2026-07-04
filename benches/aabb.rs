use criterion::{BatchSize, Criterion, black_box, criterion_group, criterion_main};
use luxide::{
    geometry::{Aabb, Point, Ray, Vector3},
    utils::Interval,
};

type Id = String;
type Setup = Box<dyn Fn() -> Ray>;
type Routine = Box<dyn Fn(Ray) -> bool>;

fn random() -> (Id, Setup, Routine) {
    let aabb = Aabb::unit();

    let setup = || -> Ray {
        let origin = Point::new(0.0, 0.0, 3.0);
        let direction = Vector3::random_in_unit_sphere();

        Ray::new(origin, direction, 0.0)
    };

    let ray_t = Interval::new(0.001, f64::INFINITY);
    let routine = move |ray| aabb.hit(black_box(ray), ray_t);

    ("random".to_string(), Box::new(setup), Box::new(routine))
}

fn hit() -> (Id, Setup, Routine) {
    let aabb = Aabb::unit();

    let setup = || -> Ray {
        let origin = Point::from_vector3(Vector3::random_in_unit_cube().unit_vector() * 3.0);

        let new_target_fn = || origin + Vector3::random_in_unit_sphere();
        let mut target = new_target_fn();
        while origin.to(target).angle(origin.to(Point::ZERO)).as_degrees() > 10.0 {
            target = new_target_fn();
        }
        let direction = origin.to(target).unit_vector();

        Ray::new(origin, direction, 0.0)
    };

    let ray_t = Interval::new(0.001, f64::INFINITY);
    let routine = move |ray| aabb.hit(black_box(ray), ray_t);

    ("hit".to_string(), Box::new(setup), Box::new(routine))
}

fn miss() -> (Id, Setup, Routine) {
    let aabb: Aabb = Aabb::unit();

    let setup = || -> Ray {
        let origin = Point::from_vector3(Vector3::random_in_unit_cube().unit_vector() * 3.0);

        let new_target_fn = || origin + Vector3::random_in_unit_sphere();
        let mut target = new_target_fn();
        while origin.to(target).angle(origin.to(Point::ZERO)).as_degrees() < 45.0 {
            target = new_target_fn();
        }
        let direction = origin.to(target).unit_vector();

        Ray::new(origin, direction, 0.0)
    };

    let ray_t = Interval::new(0.001, f64::INFINITY);
    let routine = move |ray| aabb.hit(black_box(ray), ray_t);

    ("miss".to_string(), Box::new(setup), Box::new(routine))
}

fn aabb_intersect(c: &mut Criterion) {
    let cases = [random(), hit(), miss()];

    let mut group = c.benchmark_group("aabb_intersect");
    for (id, setup, routine) in cases {
        group.bench_function(id, |b| {
            b.iter_batched(setup.as_ref(), routine.as_ref(), BatchSize::SmallInput)
        });
    }
}

criterion_group!(benches, aabb_intersect);
criterion_main!(benches);
