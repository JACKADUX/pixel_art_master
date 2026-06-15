use std::collections::HashSet;
use std::time::Instant;

use crate::color_edit::cancel::{check_cancelled, clear_cancel};
use crate::color_edit::disable::{apply_disabled_colors, filter_disabled_colors_in_palette};
use crate::color_edit::manual::apply_manual_merge_overlays;
use crate::color_edit::merge::apply_oklab_merge_from_palette;
use crate::color_edit::rgb_prefilter::{apply_rgb_prefilter, RGB_PREFILTER_DISTANCE};
use crate::color_edit::stats::{
    build_palette_cache, palette_color_set_from_cache, palette_stats_from_cache,
    REFERENCE_LAYER_PALETTE_MAX_COLORS,
};
use crate::color_edit::timing::PipelineTimer;
use crate::color_edit::types::{ColorEditRequest, ColorEditResponse, ColorEditResponsePayload};

pub fn apply_color_edit_pipeline(request: ColorEditRequest) -> Result<ColorEditResponse, String> {
    let job_id = request.job_id;
    let mut timer = PipelineTimer::start();

    let decode_start = Instant::now();
    let rgba = request.decode_rgba()?;
    timer.stages.decode_rgba_ms = PipelineTimer::elapsed_ms(decode_start);
    check_cancelled(job_id)?;

    let expected_len = (request.width as usize)
        .checked_mul(request.height as usize)
        .and_then(|pixels| pixels.checked_mul(4))
        .ok_or_else(|| "Invalid image dimensions".to_string())?;

    if rgba.len() != expected_len {
        return Err(format!(
            "RGBA buffer length {} does not match {}x{}",
            rgba.len(),
            request.width,
            request.height
        ));
    }

    let pixel_count = (request.width * request.height) as usize;
    let source = &rgba;

    let palette_start = Instant::now();
    let source_palette = build_palette_cache(source, pixel_count);
    timer.stages.unique_count = source_palette.unique_count;
    timer.stages.palette_build_ms = PipelineTimer::elapsed_ms(palette_start);
    check_cancelled(job_id)?;

    let stats_before_start = Instant::now();
    let stats_before = palette_stats_from_cache(&source_palette, REFERENCE_LAYER_PALETTE_MAX_COLORS);
    timer.stages.stats_before_ms = PipelineTimer::elapsed_ms(stats_before_start);
    check_cancelled(job_id)?;

    let prefilter_start = Instant::now();
    let (working_source, unique_after_prefilter) = apply_rgb_prefilter(
        source,
        pixel_count,
        &source_palette.entries,
        RGB_PREFILTER_DISTANCE,
        job_id,
        &mut timer.stages,
    )?;
    timer.stages.rgb_prefilter_ms = PipelineTimer::elapsed_ms(prefilter_start);
    timer.stages.unique_count_after_prefilter = unique_after_prefilter;
    check_cancelled(job_id)?;

    let working_palette = if unique_after_prefilter != source_palette.unique_count {
        build_palette_cache(&working_source, pixel_count)
    } else {
        source_palette.clone()
    };

    let merge_start = Instant::now();
    let merge_result = apply_oklab_merge_from_palette(
        request.width,
        request.height,
        &working_source,
        &working_palette.entries,
        request.threshold,
        &request.reduce_algorithm,
        job_id,
        &mut timer.stages,
    )?;
    timer.stages.merge_ms = PipelineTimer::elapsed_ms(merge_start);
    check_cancelled(job_id)?;

    let mut merged_data = merge_result.data;

    let manual_start = Instant::now();
    apply_manual_merge_overlays(
        source,
        &mut merged_data,
        pixel_count,
        &request.manual_anchors,
        &source_palette,
    );
    timer.stages.manual_ms = PipelineTimer::elapsed_ms(manual_start);
    check_cancelled(job_id)?;

    let stats_norm_start = Instant::now();
    let normalized_palette = build_palette_cache(&merged_data, pixel_count);
    let stats_after_normalized =
        palette_stats_from_cache(&normalized_palette, REFERENCE_LAYER_PALETTE_MAX_COLORS);
    timer.stages.stats_after_normalized_ms = PipelineTimer::elapsed_ms(stats_norm_start);
    check_cancelled(job_id)?;

    let active_disabled = filter_disabled_colors_in_palette(
        &palette_color_set_from_cache(&normalized_palette, REFERENCE_LAYER_PALETTE_MAX_COLORS)
            .into_iter()
            .collect::<HashSet<_>>(),
        &request.disabled_colors,
    );

    let disable_start = Instant::now();
    apply_disabled_colors(&mut merged_data, pixel_count, &active_disabled, &normalized_palette);
    timer.stages.disable_ms = PipelineTimer::elapsed_ms(disable_start);
    check_cancelled(job_id)?;

    let stats_after_start = Instant::now();
    let final_palette = build_palette_cache(&merged_data, pixel_count);
    let stats_after = palette_stats_from_cache(&final_palette, REFERENCE_LAYER_PALETTE_MAX_COLORS);
    timer.stages.stats_after_ms = PipelineTimer::elapsed_ms(stats_after_start);

    timer.finish();
    timer.stages.log_to_stderr();
    clear_cancel(job_id);

    ColorEditResponse::from_rgba(
        merged_data,
        ColorEditResponsePayload {
            stats_before,
            stats_after_normalized,
            stats_after,
            merge_group_count: merge_result.group_count,
            performance: timer.stages,
        },
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use base64::{engine::general_purpose::STANDARD, Engine as _};
    use crate::color_edit::types::ManualMergeAnchorRequest;

    fn make_request(
        width: u32,
        height: u32,
        rgba: Vec<u8>,
        threshold: f64,
        reduce_algorithm: &str,
        manual_anchors: Vec<ManualMergeAnchorRequest>,
        disabled_colors: Vec<u32>,
    ) -> ColorEditRequest {
        ColorEditRequest {
            width,
            height,
            rgba_base64: STANDARD.encode(rgba),
            threshold,
            reduce_algorithm: reduce_algorithm.to_string(),
            manual_anchors,
            disabled_colors,
            job_id: 0,
        }
    }

    fn decoded_result(response: &ColorEditResponse) -> Vec<u8> {
        STANDARD
            .decode(&response.result_rgba_base64)
            .expect("result rgba should decode")
    }

    fn pixel_at(data: &[u8], width: u32, x: u32, y: u32) -> [u8; 4] {
        let index = (y * width + x) as usize;
        let offset = index * 4;
        [
            data[offset],
            data[offset + 1],
            data[offset + 2],
            data[offset + 3],
        ]
    }

    #[test]
    fn full_pipeline_matches_merge_expectations() {
        let rgba = vec![10, 10, 10, 255, 12, 12, 12, 255, 14, 14, 14, 255];
        let response = apply_color_edit_pipeline(make_request(
            3,
            1,
            rgba,
            0.05,
            "mode",
            Vec::new(),
            Vec::new(),
        ))
        .expect("pipeline should succeed");

        assert_eq!(response.merge_group_count, 1);
        assert_eq!(response.stats_before.unique_count, 3);
        assert_eq!(response.stats_after.unique_count, 1);
        let result_rgba = decoded_result(&response);
        let first = pixel_at(&result_rgba, 3, 0, 0);
        assert_eq!(pixel_at(&result_rgba, 3, 1, 0), first);
        assert_eq!(pixel_at(&result_rgba, 3, 2, 0), first);
    }

    #[test]
    fn full_pipeline_applies_disabled_colors() {
        let red = (255u32 << 24) | (20u32 << 16) | (20u32 << 8) | 220;
        let blue = (255u32 << 24) | (220u32 << 16) | (20u32 << 8) | 20;
        let rgba = vec![220, 20, 20, 255, 20, 20, 220, 255];
        let response = apply_color_edit_pipeline(make_request(
            2,
            1,
            rgba,
            0.035,
            "mode",
            vec![ManualMergeAnchorRequest {
                color: red,
                threshold: 0.05,
            }],
            vec![blue],
        ))
        .expect("pipeline should succeed");

        assert_eq!(response.merge_group_count, 2);
        assert_eq!(response.stats_after.unique_count, 1);
        let result_rgba = decoded_result(&response);
        assert_eq!(pixel_at(&result_rgba, 2, 0, 0), [220, 20, 20, 255]);
        assert_eq!(pixel_at(&result_rgba, 2, 1, 0), [220, 20, 20, 255]);
    }
}
