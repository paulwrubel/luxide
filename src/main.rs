use std::fs::{self, File};

use luxide::Image;

const OUTPUT_DIR: &str = "output";

fn main() -> std::io::Result<()> {
    fs::create_dir_all(OUTPUT_DIR)?;
    let mut file = File::create(format!("{OUTPUT_DIR}/test.ppm"))?;

    let width = 500;
    let height = 500;

    let image = Image::generate(width, height);

    image.to_ppm(&mut file)?;

    Ok(())
}
