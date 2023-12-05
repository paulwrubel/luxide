use std::sync::Arc;

use indexmap::IndexMap;
use serde::Deserialize;
use textures::Texture;

use crate::{
    geometry::{
        compounds::{AxisAlignedPBox, List, BVH},
        instances::{RotateYAxis, Translate},
        primitives::{Parallelogram, Sphere},
        volumes, Geometric,
    },
    shading::{materials::Material, textures},
    utils::Angle,
};

use super::{Build, Builts};

#[derive(Deserialize)]
#[serde(rename_all = "snake_case")]
// #[serde(untagged)]
#[serde(tag = "type")]
pub enum GeometricRefOrInline {
    Ref(String),
    // #[serde(flatten)]
    Inline(Box<GeometricData>),
}

impl Build<Arc<dyn Geometric>> for GeometricRefOrInline {
    fn build(&self, builts: &Builts) -> Result<Arc<dyn Geometric>, String> {
        match self {
            Self::Ref(name) => Ok(Arc::clone(builts.geometrics.get(name).ok_or(format!(
                "Geometric {} not found. Is it specified in the geometrics list?",
                name
            ))?)),
            Self::Inline(data) => data.build(builts),
        }
    }
}

#[derive(Deserialize)]
// #[serde(untagged)]
#[serde(tag = "type")]
pub enum GeometricData {
    #[serde(rename = "box")]
    CompoundAxisAlignedPBox {
        a: [f64; 3],
        b: [f64; 3],
        is_culled: Option<bool>,
        material: String,
    },
    #[serde(rename = "list")]
    CompoundList {
        use_bvh: Option<bool>,
        geometrics: Vec<GeometricRefOrInline>,
    },
    #[serde(rename = "rotate_y")]
    InstanceRotateYAxis {
        geometric: GeometricRefOrInline,
        angle: Angle,
        around: [f64; 3],
    },
    #[serde(rename = "translate")]
    InstanceTranslate {
        geometric: GeometricRefOrInline,
        translation: [f64; 3],
    },
    #[serde(rename = "parallelogram")]
    PrimitiveParallelogram {
        lower_left: [f64; 3],
        u: [f64; 3],
        v: [f64; 3],
        is_culled: Option<bool>,
        material: String,
    },
    #[serde(rename = "sphere")]
    PrimitiveSphere {
        center: [f64; 3],
        radius: f64,
        material: String,
    },
    #[serde(rename = "constant_volume")]
    VolumeConstant {
        geometric: GeometricRefOrInline,
        density: f64,
        reflectance_texture: String,
    },
}

impl Build<Arc<dyn Geometric>> for &GeometricData {
    fn build(&self, builts: &Builts) -> Result<Arc<dyn Geometric>, String> {
        (*self).build(builts)
    }
}

impl Build<Arc<dyn Geometric>> for GeometricData {
    fn build(&self, builts: &Builts) -> Result<Arc<dyn Geometric>, String> {
        match self {
            Self::CompoundAxisAlignedPBox {
                a,
                b,
                is_culled,
                material: material_name,
            } => {
                let material = builts.materials.get(material_name).ok_or(format!(
                    "Material {} not found. Is it specified in the materials list?",
                    material_name
                ))?;

                Ok(Arc::new(AxisAlignedPBox::new(
                    (*a).into(),
                    (*b).into(),
                    (*is_culled).unwrap_or(false),
                    Arc::clone(material),
                )))
            }
            Self::CompoundList {
                use_bvh,
                geometrics: geometric_refs,
            } => {
                let mut list = List::new();
                for geometric_ref in geometric_refs {
                    let geometric = geometric_ref.build(builts)?;
                    // let geometric = builts.geometrics.get(name).ok_or(format!(
                    //     "Geometric {} not found. Is it specified in the geometrics list?",
                    //     name
                    // ))?;
                    list.push(geometric);
                }

                if use_bvh.unwrap_or(false) {
                    Ok(Arc::new(BVH::from_list(list)))
                } else {
                    Ok(Arc::new(list))
                }
            }
            Self::InstanceRotateYAxis {
                geometric: geometric_ref,
                angle,
                around,
            } => {
                let geometric = geometric_ref.build(builts)?;
                // let geometric = builts.geometrics.get(geometric_name).ok_or(format!(
                //     "Geometric {} not found. Is it specified in the geometrics list?",
                //     geometric_name
                // ))?;

                Ok(Arc::new(RotateYAxis::new(
                    geometric,
                    *angle,
                    (*around).into(),
                )))
            }
            Self::InstanceTranslate {
                geometric: geometric_ref,
                translation,
            } => {
                let geometric = geometric_ref.build(builts)?;
                // let geometric = builts.geometrics.get(geometric_name).ok_or(format!(
                //     "Geometric {} not found. Is it specified in the geometrics list?",
                //     geometric_name
                // ))?;

                Ok(Arc::new(Translate::new(geometric, (*translation).into())))
            }
            Self::PrimitiveParallelogram {
                lower_left,
                u,
                v,
                is_culled,
                material: material_name,
            } => {
                let material = builts.materials.get(material_name).ok_or(format!(
                    "Material {} not found. Is it specified in the materials list?",
                    material_name
                ))?;

                Ok(Arc::new(Parallelogram::new(
                    (*lower_left).into(),
                    (*u).into(),
                    (*v).into(),
                    (*is_culled).unwrap_or(false),
                    Arc::clone(material),
                )))
            }
            Self::PrimitiveSphere {
                center,
                radius,
                material: material_name,
            } => {
                let material = builts.materials.get(material_name).ok_or(format!(
                    "Material {} not found. Is it specified in the materials list?",
                    material_name
                ))?;

                Ok(Arc::new(Sphere::new(
                    (*center).into(),
                    *radius,
                    Arc::clone(material),
                )))
            }
            Self::VolumeConstant {
                geometric: geometric_ref,
                density,
                reflectance_texture: reflectance_texture_name,
            } => {
                let geometric = geometric_ref.build(builts)?;
                // let geometric = builts.geometrics.get(geometric_name).ok_or(format!(
                //     "Geometric {} not found. Is it specified in the geometrics list?",
                //     geometric_name
                // ))?;
                let reflectance_texture =
                    builts
                        .textures
                        .get(reflectance_texture_name)
                        .ok_or(format!(
                            "Texture {} not found. Is it specified in the textures list?",
                            reflectance_texture_name
                        ))?;

                Ok(Arc::new(volumes::Constant::new(
                    geometric,
                    *density,
                    Arc::clone(reflectance_texture),
                )))
            }
        }
    }
}