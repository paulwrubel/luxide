use std::sync::Arc;

use serde::{Deserialize, Serialize};

use crate::{
    geometry::{
        Geometric,
        compounds::{AxisAlignedPBox, BVH, List, ModelObj},
        instances::{RotateXAxis, RotateYAxis, RotateZAxis, Translate},
        primitives::{Parallelogram, Sphere, Triangle},
        volumes,
    },
    utils::Angle,
};

use super::{Build, Builts, materials::MaterialRefOrInline};

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
#[serde(untagged)]
pub enum GeometricRefOrInline {
    Ref(String),
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

#[derive(Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
#[serde(deny_unknown_fields)]
pub enum GeometricData {
    #[serde(rename = "box")]
    CompoundAxisAlignedPBox {
        a: [f64; 3],
        b: [f64; 3],
        is_culled: Option<bool>,
        material: MaterialRefOrInline,
    },
    #[serde(rename = "list")]
    CompoundList {
        use_bvh: Option<bool>,
        geometrics: Vec<GeometricRefOrInline>,
    },
    #[serde(rename = "obj_model")]
    CompoundModelObj {
        filename: String,
        origin: Option<[f64; 3]>,
        scale: Option<f64>,
        recalculate_normals: Option<bool>,
        use_bvh: Option<bool>,
        material: MaterialRefOrInline,
    },
    #[serde(rename = "rotate_x")]
    InstanceRotateXAxis {
        geometric: GeometricRefOrInline,
        #[serde(flatten)]
        angle: Angle,
        around: Option<[f64; 3]>,
    },
    #[serde(rename = "rotate_y")]
    InstanceRotateYAxis {
        geometric: GeometricRefOrInline,
        #[serde(flatten)]
        angle: Angle,
        around: Option<[f64; 3]>,
    },
    #[serde(rename = "rotate_z")]
    InstanceRotateZAxis {
        geometric: GeometricRefOrInline,
        #[serde(flatten)]
        angle: Angle,
        around: Option<[f64; 3]>,
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
        material: MaterialRefOrInline,
    },
    #[serde(rename = "sphere")]
    PrimitiveSphere {
        center: [f64; 3],
        radius: f64,
        material: MaterialRefOrInline,
    },
    #[serde(rename = "triangle")]
    PrimitiveTriangle {
        a: [f64; 3],
        b: [f64; 3],
        c: [f64; 3],
        is_culled: Option<bool>,
        material: MaterialRefOrInline,
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
                material,
            } => {
                let material = material.build(builts)?;

                Ok(Arc::new(AxisAlignedPBox::new(
                    (*a).into(),
                    (*b).into(),
                    (*is_culled).unwrap_or(false),
                    material,
                )))
            }
            Self::CompoundList {
                use_bvh,
                geometrics: geometric_refs,
            } => {
                let mut list = List::new();
                for geometric_ref in geometric_refs {
                    let geometric = geometric_ref.build(builts)?;
                    list.push(geometric);
                }

                if use_bvh.unwrap_or(false) {
                    Ok(Arc::new(BVH::from_list(list)))
                } else {
                    Ok(Arc::new(list))
                }
            }
            Self::CompoundModelObj {
                filename,
                origin,
                scale,
                recalculate_normals,
                use_bvh,
                material,
            } => {
                let material = material.build(builts)?;

                let model = ModelObj::from_filename(
                    filename,
                    (*origin).unwrap_or([0.0, 0.0, 0.0]).into(),
                    (*scale).unwrap_or(1.0),
                    (*recalculate_normals).unwrap_or(false),
                    (*use_bvh).unwrap_or(false),
                    material,
                )?;

                Ok(Arc::new(model))
            }
            Self::InstanceRotateXAxis {
                geometric: geometric_ref,
                angle,
                around,
            } => {
                let geometric = geometric_ref.build(builts)?;

                Ok(Arc::new(RotateXAxis::new(
                    geometric,
                    *angle,
                    around.unwrap_or([0.0, 0.0, 0.0]).into(),
                )))
            }
            Self::InstanceRotateYAxis {
                geometric: geometric_ref,
                angle,
                around,
            } => {
                let geometric = geometric_ref.build(builts)?;

                Ok(Arc::new(RotateYAxis::new(
                    geometric,
                    *angle,
                    around.unwrap_or([0.0, 0.0, 0.0]).into(),
                )))
            }
            Self::InstanceRotateZAxis {
                geometric: geometric_ref,
                angle,
                around,
            } => {
                let geometric = geometric_ref.build(builts)?;

                Ok(Arc::new(RotateZAxis::new(
                    geometric,
                    *angle,
                    around.unwrap_or([0.0, 0.0, 0.0]).into(),
                )))
            }
            Self::InstanceTranslate {
                geometric: geometric_ref,
                translation,
            } => {
                let geometric = geometric_ref.build(builts)?;

                Ok(Arc::new(Translate::new(geometric, (*translation).into())))
            }
            Self::PrimitiveParallelogram {
                lower_left,
                u,
                v,
                is_culled,
                material,
            } => {
                let material = material.build(builts)?;

                Ok(Arc::new(Parallelogram::new(
                    (*lower_left).into(),
                    (*u).into(),
                    (*v).into(),
                    (*is_culled).unwrap_or(false),
                    material,
                )))
            }
            Self::PrimitiveSphere {
                center,
                radius,
                material,
            } => {
                let material = material.build(builts)?;

                Ok(Arc::new(Sphere::new((*center).into(), *radius, material)))
            }
            Self::PrimitiveTriangle {
                a,
                b,
                c,
                is_culled,
                material,
            } => {
                let material = material.build(builts)?;

                Ok(Arc::new(Triangle::new(
                    (*a).into(),
                    (*b).into(),
                    (*c).into(),
                    (*is_culled).unwrap_or(false),
                    material,
                )))
            }
            Self::VolumeConstant {
                geometric: geometric_ref,
                density,
                reflectance_texture: reflectance_texture_name,
            } => {
                let geometric = geometric_ref.build(builts)?;

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
