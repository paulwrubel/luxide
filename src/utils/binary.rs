use bincode::config;

use crate::tracing::PixelData;

pub fn encode_pixel_data(data: &PixelData) -> Result<Vec<u8>, String> {
    bincode::encode_to_vec(data, config::standard()).map_err(|e| e.to_string())
}

pub fn decode_pixel_data(data: &[u8]) -> Result<PixelData, String> {
    bincode::decode_from_slice(data, config::standard())
        .map(|(pixel_data, _)| pixel_data)
        .map_err(|e| e.to_string())
}
