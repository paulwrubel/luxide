use serde::{Deserialize, Serialize};

use crate::{camera::Camera, geometry::Point};

use super::{Build, Builts};

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case", untagged)]
pub enum CameraRefOrInline {
    Ref(String),
    Inline(Box<CameraData>),
}

impl Build<Camera> for CameraRefOrInline {
    fn build(&self, builts: &Builts) -> Result<Camera, String> {
        match self {
            Self::Ref(name) => Ok(builts
                .cameras
                .get(name)
                .ok_or(format!(
                    "Camera {} not found. Is it specified in the cameras list?",
                    name
                ))?
                .clone()),
            Self::Inline(data) => data.build(builts),
        }
    }
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CameraData {
    pub vertical_field_of_view_degrees: f64,
    pub eye_location: [f64; 3],
    pub target_location: [f64; 3],
    pub view_up: [f64; 3],
    pub defocus_angle_degrees: f64,
    pub focus_distance: FocusDistance,
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
                FocusDistance::Type(FocusDistanceType::EyeToTarget) => {
                    eye_location.to(target_location).length()
                }
            },
        );

        Ok(camera)
    }
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case", untagged)]
pub enum FocusDistance {
    Exact(f64),
    Type(FocusDistanceType),
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum FocusDistanceType {
    EyeToTarget,
}
