use noise::NoiseFn;

use crate::{geometry::Point, shading::Color};

use super::Texture;

pub struct Noise<F, Input, Output>
where
    F: NoiseFn<f64, 3> + Sync + Send,
    Input: Fn(Point) -> Point + Sync + Send,
    Output: Fn(f64, Point) -> f64 + Sync + Send,
{
    input_fn: Option<Input>,
    output_fn: Option<Output>,
    // source: Box<dyn NoiseTrait<F>>,
    source: F,
}

impl<F, Input, Output> Noise<F, Input, Output>
where
    F: NoiseFn<f64, 3> + Sync + Send,
    Input: Fn(Point) -> Point + Sync + Send,
    Output: Fn(f64, Point) -> f64 + Sync + Send,
{
    pub fn new(source: F /*Box<dyn NoiseTrait<F>>*/) -> Noise<F, Input, Output> {
        Noise {
            input_fn: None,
            output_fn: None,
            source,
        }
    }

    pub fn map_input(self, input_fn: Input) -> Self {
        Noise {
            input_fn: Some(input_fn),
            ..self
        }
    }

    pub fn map_output(self, output_fn: Output) -> Self {
        Noise {
            output_fn: Some(output_fn),
            ..self
        }
    }
}

impl<F, Input, Output> Texture for Noise<F, Input, Output>
where
    F: NoiseFn<f64, 3> + Sync + Send,
    Input: Fn(Point) -> Point + Sync + Send,
    Output: Fn(f64, Point) -> f64 + Sync + Send,
{
    fn value(&self, _u: f64, _v: f64, p: Point) -> Color {
        let input = match self.input_fn {
            Some(ref input_fn) => input_fn(p),
            None => p,
        };
        let val = self.source.get([p.0.x, p.0.y, p.0.z]);
        let output = match self.output_fn {
            Some(ref output_fn) => output_fn(val, input),
            None => val,
        };

        Color::WHITE * output
    }
}
