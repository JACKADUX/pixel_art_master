use std::collections::HashMap;

use crate::color_edit::oklab::{color_to_oklab, Oklab};
use crate::color_edit::types::{ColorEntryResponse, PaletteStatsResponse};

pub const REFERENCE_LAYER_PALETTE_MAX_COLORS: usize = 256;

#[derive(Clone)]
pub struct PaletteColorMeta {
    pub color: u32,
    pub count: u32,
    pub oklab: Oklab,
    pub lightness: f64,
    pub hex: String,
}

#[derive(Clone)]
pub struct PaletteCache {
    pub unique_count: u32,
    pub entries: Vec<PaletteColorMeta>,
}

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

fn to_hex_alpha(color: u32) -> String {
    let r = color & 0xff;
    let g = (color >> 8) & 0xff;
    let b = (color >> 16) & 0xff;
    let a = (color >> 24) & 0xff;
    format!("#{:02x}{:02x}{:02x}{:02x}", r, g, b, a)
}

pub fn build_palette_cache(data: &[u8], pixel_count: usize) -> PaletteCache {
    let mut counts: HashMap<u32, u32> = HashMap::new();
    for index in 0..pixel_count {
        let color = read_pixel_color(data, index);
        if get_alpha(color) == 0 {
            continue;
        }
        *counts.entry(color).or_insert(0) += 1;
    }

    let mut entries: Vec<PaletteColorMeta> = counts
        .into_iter()
        .map(|(color, count)| {
            let oklab = color_to_oklab(color);
            PaletteColorMeta {
                lightness: oklab.l,
                hex: to_hex_alpha(color),
                color,
                count,
                oklab,
            }
        })
        .collect();

    entries.sort_by(|a, b| {
        let lightness_delta = a.lightness.partial_cmp(&b.lightness).unwrap_or(std::cmp::Ordering::Equal);
        if lightness_delta != std::cmp::Ordering::Equal {
            return lightness_delta;
        }
        a.hex.cmp(&b.hex)
    });

    PaletteCache {
        unique_count: entries.len() as u32,
        entries,
    }
}

pub fn palette_stats_from_cache(
    cache: &PaletteCache,
    max_colors: usize,
) -> PaletteStatsResponse {
    PaletteStatsResponse {
        unique_count: cache.unique_count,
        colors: cache
            .entries
            .iter()
            .take(max_colors)
            .map(|entry| ColorEntryResponse {
                color: entry.color,
                count: entry.count,
            })
            .collect(),
    }
}

pub fn palette_color_set_from_cache(cache: &PaletteCache, max_colors: usize) -> Vec<u32> {
    cache
        .entries
        .iter()
        .take(max_colors)
        .map(|entry| entry.color)
        .collect()
}
