use std::sync::Arc;

use serde::{Deserialize, Serialize};

use crate::geometry::{Geometric, Point};

/// Pivot point for rotation geometrics.
///
/// Serializes as either a string (`"center"` or `"origin"`) or a 3-element array (`[x, y, z]`).
#[derive(Debug, Copy, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Around {
    /// Rotate around the child geometric's center point (computed at build time)
    Center,
    /// Rotate around the world origin `[0.0, 0.0, 0.0]`
    Origin,
    /// Rotate around an explicit custom point
    Point([f64; 3]),
}

impl Around {
    pub fn point(&self, geometric: &Arc<dyn Geometric>) -> Point {
        match self {
            Around::Center => geometric.bounding_box().center(),
            Around::Origin => Point::ORIGIN,
            Around::Point(p) => (*p).into(),
        }
    }
}

/// Upgrades legacy `around` values in a `serde_json::Value` tree so
/// they match the current `Around` serde format.
///
/// For any object with `"type": "rotate_x" | "rotate_y" | "rotate_z" | "scale"`:
/// - Bare array `[x, y, z]` → wraps as `{"point": [x, y, z]}`
/// - Missing `"around"` key → inserts `"around": "origin"`
/// - Already a string or object → left unchanged
///
/// Idempotent — calling on already-upgraded values is a no-op.
pub fn upgrade_legacy_around(value: &mut serde_json::Value) {
    match value {
        serde_json::Value::Object(map) => {
            // only act on rotation geometrics
            if let Some(serde_json::Value::String(type_str)) = map.get("type")
                && matches!(
                    type_str.as_str(),
                    "rotate_x" | "rotate_y" | "rotate_z" | "scale"
                )
            {
                match map.get("around") {
                    // bare array → wrap in {"point": [...]}
                    Some(serde_json::Value::Array(arr)) => {
                        let mut point_obj = serde_json::Map::new();
                        point_obj
                            .insert("point".to_string(), serde_json::Value::Array(arr.clone()));
                        map.insert("around".to_string(), serde_json::Value::Object(point_obj));
                    }
                    // missing → insert "origin"
                    None => {
                        map.insert(
                            "around".to_string(),
                            serde_json::Value::String("origin".to_string()),
                        );
                    }
                    // already a string or object → leave as-is
                    _ => {}
                }
            }
            // recurse into all values
            for v in map.values_mut() {
                upgrade_legacy_around(v);
            }
        }
        serde_json::Value::Array(arr) => {
            for v in arr.iter_mut() {
                upgrade_legacy_around(v);
            }
        }
        _ => {}
    }
}
