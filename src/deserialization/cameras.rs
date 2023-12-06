use serde::Deserialize;

use crate::{camera::Camera, geometry::Point};

use super::{Build, Builts};

#[derive(Deserialize)]
pub struct CameraData {
    vertical_field_of_view_degrees: f64,
    eye_location: [f64; 3],
    target_location: [f64; 3],
    view_up: [f64; 3],
    defocus_angle_degrees: f64,
    focus_distance: FocusDistance,
}

impl Build<Camera> for CameraData {
    fn build(&self, _builts: &Builts) -> Result<Camera, String> {
        let eye_location: Point = self.eye_location.into();
        let target_location: Point = self.target_location.into();
        let camera = Camera::new(
            self.vertical_field_of_view_degrees,
            eye_location,
            target_location,
            self.view_up.into(),
            self.defocus_angle_degrees,
            match self.focus_distance {
                FocusDistance::Exact(distance) => distance,
                // FocusDistance::EyeToTarget => eye_location.to(target_location).length(),
                FocusDistance::Type(FocusDistanceType::EyeToTarget) => {
                    eye_location.to(target_location).length()
                }
            },
        );

        Ok(camera)
    }
}

#[derive(Deserialize)]
#[serde(rename_all = "snake_case")]
#[serde(untagged)]
enum FocusDistance {
    Exact(f64),
    // EyeToTarget,
    // #[serde(untagged)]
    Type(FocusDistanceType),
}

#[derive(Deserialize)]
#[serde(rename_all = "snake_case")]
enum FocusDistanceType {
    EyeToTarget,
}
