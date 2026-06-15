use std::collections::HashMap;

use crate::color_edit::oklab::{can_merge_oklab_colors, clamp_oklab_merge_threshold, Oklab};
use crate::color_edit::stats::PaletteCache;
use crate::color_edit::types::ManualMergeAnchorRequest;

fn read_pixel_color(data: &[u8], index: usize) -> u32 {
    let offset = index * 4;
    let r = data[offset];
    let g = data[offset + 1];
    let b = data[offset + 2];
    let a = data[offset + 3];
    u32::from(a) << 24 | u32::from(b) << 16 | u32::from(g) << 8 | u32::from(r)
}

fn get_alpha(color: u32) -> u8 {
    ((color >> 24) & 0xff) as u8
}

fn write_pixel_color(
    data: &mut [u8],
    index: usize,
    color: u32,
    preserve_alpha: bool,
    source_alpha: u8,
) {
    let offset = index * 4;
    let r = (color & 0xff) as u8;
    let g = ((color >> 8) & 0xff) as u8;
    let b = ((color >> 16) & 0xff) as u8;
    let alpha = if preserve_alpha {
        source_alpha
    } else {
        get_alpha(color)
    };
    data[offset] = r;
    data[offset + 1] = g;
    data[offset + 2] = b;
    data[offset + 3] = alpha;
}

struct NormalizedAnchor {
    color: u32,
    threshold: f64,
    oklab: Oklab,
}

pub fn apply_manual_merge_overlays(
    source: &[u8],
    merged: &mut [u8],
    pixel_count: usize,
    anchors: &[ManualMergeAnchorRequest],
    source_palette: &PaletteCache,
) {
    if anchors.is_empty() {
        return;
    }

    let oklab_by_color: HashMap<u32, Oklab> = source_palette
        .entries
        .iter()
        .map(|entry| (entry.color, entry.oklab))
        .collect();

    let normalized: Vec<NormalizedAnchor> = anchors
        .iter()
        .map(|anchor| NormalizedAnchor {
            color: anchor.color,
            threshold: clamp_oklab_merge_threshold(anchor.threshold),
            oklab: oklab_by_color
                .get(&anchor.color)
                .copied()
                .unwrap_or_else(|| crate::color_edit::oklab::color_to_oklab(anchor.color)),
        })
        .collect();

    for index in 0..pixel_count {
        let source_color = read_pixel_color(source, index);
        if get_alpha(source_color) == 0 {
            continue;
        }

        let source_oklab = oklab_by_color
            .get(&source_color)
            .copied()
            .unwrap_or_else(|| crate::color_edit::oklab::color_to_oklab(source_color));

        for anchor in &normalized {
            if can_merge_oklab_colors(source_oklab, anchor.oklab, anchor.threshold) {
                write_pixel_color(
                    merged,
                    index,
                    anchor.color,
                    get_alpha(anchor.color) == 255,
                    get_alpha(source_color),
                );
            }
        }
    }
}
