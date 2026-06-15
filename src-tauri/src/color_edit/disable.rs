use std::collections::{HashMap, HashSet};

use crate::color_edit::oklab::{weighted_delta_e, Oklab};
use crate::color_edit::stats::PaletteCache;

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

fn find_nearest_palette_color(target: Oklab, candidates: &[(u32, Oklab)]) -> Option<u32> {
    if candidates.is_empty() {
        return None;
    }
    let mut best_color = candidates[0].0;
    let mut best_distance = weighted_delta_e(target, candidates[0].1);

    for &(color, oklab) in &candidates[1..] {
        let distance = weighted_delta_e(target, oklab);
        if distance < best_distance {
            best_color = color;
            best_distance = distance;
        }
    }

    Some(best_color)
}

pub fn filter_disabled_colors_in_palette(
    palette_colors: &HashSet<u32>,
    disabled_colors: &[u32],
) -> Vec<u32> {
    disabled_colors
        .iter()
        .copied()
        .filter(|color| palette_colors.contains(color))
        .collect()
}

pub fn apply_disabled_colors(
    data: &mut [u8],
    pixel_count: usize,
    disabled_colors: &[u32],
    palette: &PaletteCache,
) {
    if disabled_colors.is_empty() {
        return;
    }

    let disabled_set: HashSet<u32> = disabled_colors.iter().copied().collect();
    let oklab_by_color: HashMap<u32, Oklab> = palette
        .entries
        .iter()
        .map(|entry| (entry.color, entry.oklab))
        .collect();

    let remaining: Vec<(u32, Oklab)> = palette
        .entries
        .iter()
        .filter(|entry| !disabled_set.contains(&entry.color))
        .map(|entry| (entry.color, entry.oklab))
        .collect();

    if remaining.is_empty() {
        return;
    }

    let mut replacement_map: HashMap<u32, u32> = HashMap::new();
    for &disabled in &disabled_set {
        let target = oklab_by_color
            .get(&disabled)
            .copied()
            .unwrap_or_else(|| crate::color_edit::oklab::color_to_oklab(disabled));
        if let Some(replacement) = find_nearest_palette_color(target, &remaining) {
            replacement_map.insert(disabled, replacement);
        }
    }

    if replacement_map.is_empty() {
        return;
    }

    for index in 0..pixel_count {
        let source_color = read_pixel_color(data, index);
        if get_alpha(source_color) == 0 {
            continue;
        }
        if let Some(replacement) = replacement_map.get(&source_color) {
            write_pixel_color(
                data,
                index,
                *replacement,
                get_alpha(*replacement) == 255,
                get_alpha(source_color),
            );
        }
    }
}
