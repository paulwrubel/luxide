use std::fs;

use luxide::Image;

const OUTPUT_DIR: &str = "output";

fn main() -> std::io::Result<()> {
    fs::create_dir_all(OUTPUT_DIR)?;
    let filename = format!("{OUTPUT_DIR}/test.ppm");

    let width = 200;
    let height = 100;

    let image = Image::generate(width, height);

    match image.save(&filename) {
        Ok(()) => {
            println!("Saved image to {filename}");
        }
        Err(e) => {
            println!("Failed to save image: {e}");
        }
    }

    Ok(())
}
