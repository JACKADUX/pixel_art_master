use base64::{engine::general_purpose::STANDARD, Engine as _};
use serde::{Deserialize, Serialize};

use crate::color_edit::timing::StageTimings;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ManualMergeAnchorRequest {
    pub color: u32,
    pub threshold: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ColorEditRequest {
    pub width: u32,
    pub height: u32,
    pub rgba_base64: String,
    pub threshold: f64,
    pub reduce_algorithm: String,
    pub manual_anchors: Vec<ManualMergeAnchorRequest>,
    pub disabled_colors: Vec<u32>,
    #[serde(default)]
    pub job_id: u64,
}

impl ColorEditRequest {
    pub fn decode_rgba(&self) -> Result<Vec<u8>, String> {
        STANDARD
            .decode(&self.rgba_base64)
            .map_err(|error| format!("Failed to decode RGBA base64: {error}"))
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ColorEntryResponse {
    pub color: u32,
    pub count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaletteStatsResponse {
    pub unique_count: u32,
    pub colors: Vec<ColorEntryResponse>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ColorEditPerformanceResponse {
    pub decode_rgba_ms: f64,
    pub palette_build_ms: f64,
    pub stats_before_ms: f64,
    pub merge_ms: f64,
    pub manual_ms: f64,
    pub stats_after_normalized_ms: f64,
    pub disable_ms: f64,
    pub stats_after_ms: f64,
    pub encode_rgba_ms: f64,
    pub total_ms: f64,
    pub unique_count: u32,
    pub unique_count_after_prefilter: u32,
    pub rgb_prefilter_ms: f64,
    pub rgb_prefilter_pair_checks: u64,
    pub merge_pair_checks: u64,
    pub merge_pair_skips: u64,
}

impl From<StageTimings> for ColorEditPerformanceResponse {
    fn from(value: StageTimings) -> Self {
        Self {
            decode_rgba_ms: value.decode_rgba_ms,
            palette_build_ms: value.palette_build_ms,
            stats_before_ms: value.stats_before_ms,
            merge_ms: value.merge_ms,
            manual_ms: value.manual_ms,
            stats_after_normalized_ms: value.stats_after_normalized_ms,
            disable_ms: value.disable_ms,
            stats_after_ms: value.stats_after_ms,
            encode_rgba_ms: value.encode_rgba_ms,
            total_ms: value.total_ms,
            unique_count: value.unique_count,
            unique_count_after_prefilter: value.unique_count_after_prefilter,
            rgb_prefilter_ms: value.rgb_prefilter_ms,
            rgb_prefilter_pair_checks: value.rgb_prefilter_pair_checks,
            merge_pair_checks: value.merge_pair_checks,
            merge_pair_skips: value.merge_pair_skips,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ColorEditResponse {
    pub result_rgba_base64: String,
    pub stats_before: PaletteStatsResponse,
    pub stats_after_normalized: PaletteStatsResponse,
    pub stats_after: PaletteStatsResponse,
    pub merge_group_count: u32,
    pub performance: ColorEditPerformanceResponse,
}

pub struct ColorEditResponsePayload {
    pub stats_before: PaletteStatsResponse,
    pub stats_after_normalized: PaletteStatsResponse,
    pub stats_after: PaletteStatsResponse,
    pub merge_group_count: u32,
    pub performance: StageTimings,
}

impl ColorEditResponse {
    pub fn from_rgba(result_rgba: Vec<u8>, rest: ColorEditResponsePayload) -> Result<Self, String> {
        Ok(Self {
            result_rgba_base64: STANDARD.encode(&result_rgba),
            stats_before: rest.stats_before,
            stats_after_normalized: rest.stats_after_normalized,
            stats_after: rest.stats_after,
            merge_group_count: rest.merge_group_count,
            performance: rest.performance.into(),
        })
    }
}
