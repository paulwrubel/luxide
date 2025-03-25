use std::collections::HashMap;

use crate::shading::Color;

pub trait CheckpointDestination {
    fn checkpoint(&self, pixel_data: HashMap<(u32, u32), Color>) -> Result<(), String>;
}
