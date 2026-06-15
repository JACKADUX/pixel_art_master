use std::collections::{HashMap, HashSet};

use crate::color_edit::cancel::check_cancelled;
use crate::color_edit::oklab::{
    can_merge_oklab_colors, clamp_oklab_merge_threshold, oklab_chroma, Oklab,
    HARD_L_LIMIT,
};
use crate::color_edit::stats::PaletteColorMeta;
use crate::color_edit::timing::StageTimings;

const A_BUCKET_SIZE: f64 = 0.05;
const B_BUCKET_SIZE: f64 = 0.05;

pub struct PaletteEntry {
    pub color: u32,
    pub pixel_count: u32,
    pub oklab: Oklab,
}

struct UnionFind {
    parent: Vec<usize>,
    rank: Vec<usize>,
}

impl UnionFind {
    fn new(size: usize) -> Self {
        Self {
            parent: (0..size).collect(),
            rank: vec![0; size],
        }
    }

    fn find(&mut self, index: usize) -> usize {
        if self.parent[index] != index {
            let root = self.find(self.parent[index]);
            self.parent[index] = root;
        }
        self.parent[index]
    }

    fn union(&mut self, a: usize, b: usize) {
        let root_a = self.find(a);
        let root_b = self.find(b);
        if root_a == root_b {
            return;
        }

        if self.rank[root_a] < self.rank[root_b] {
            self.parent[root_a] = root_b;
        } else if self.rank[root_a] > self.rank[root_b] {
            self.parent[root_b] = root_a;
        } else {
            self.parent[root_b] = root_a;
            self.rank[root_a] += 1;
        }
    }
}

#[derive(Eq, PartialEq, Hash, Clone, Copy)]
struct SpatialBucket {
    l: i32,
    a: i32,
    b: i32,
}

fn spatial_bucket(oklab: Oklab) -> SpatialBucket {
    SpatialBucket {
        l: (oklab.l / HARD_L_LIMIT).floor() as i32,
        a: (oklab.a / A_BUCKET_SIZE).floor() as i32,
        b: (oklab.b / B_BUCKET_SIZE).floor() as i32,
    }
}

fn neighbor_buckets(center: SpatialBucket) -> Vec<SpatialBucket> {
    let mut buckets = Vec::with_capacity(27);
    for dl in -1..=1 {
        for da in -1..=1 {
            for db in -1..=1 {
                buckets.push(SpatialBucket {
                    l: center.l + dl,
                    a: center.a + da,
                    b: center.b + db,
                });
            }
        }
    }
    buckets
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

fn palette_entries_from_cache(entries: &[PaletteColorMeta]) -> Vec<PaletteEntry> {
    entries
        .iter()
        .map(|entry| PaletteEntry {
            color: entry.color,
            pixel_count: entry.count,
            oklab: entry.oklab,
        })
        .collect()
}

fn pick_mode_representative(entries: &[PaletteEntry]) -> u32 {
    entries
        .iter()
        .max_by_key(|entry| entry.pixel_count)
        .map(|entry| entry.color)
        .unwrap_or(0)
}

fn pick_high_chroma_representative(entries: &[PaletteEntry]) -> u32 {
    let mut best = &entries[0];
    let mut best_chroma = oklab_chroma(best.oklab);
    for entry in &entries[1..] {
        let chroma = oklab_chroma(entry.oklab);
        if chroma > best_chroma
            || (chroma == best_chroma && entry.pixel_count > best.pixel_count)
        {
            best = entry;
            best_chroma = chroma;
        }
    }
    best.color
}

fn reduce_cluster_colors(entries: &[PaletteEntry], algorithm: &str) -> u32 {
    if entries.is_empty() {
        return 0;
    }
    match algorithm {
        "highChroma" => pick_high_chroma_representative(entries),
        _ => pick_mode_representative(entries),
    }
}

fn cluster_palette(
    palette: &[PaletteEntry],
    threshold: f64,
    job_id: u64,
    timings: &mut StageTimings,
) -> Result<HashMap<usize, Vec<usize>>, String> {
    let color_count = palette.len();
    let mut union_find = UnionFind::new(color_count);
    let mut buckets: HashMap<SpatialBucket, Vec<usize>> = HashMap::new();

    for (index, entry) in palette.iter().enumerate() {
        buckets
            .entry(spatial_bucket(entry.oklab))
            .or_default()
            .push(index);
    }

    let mut compared_pairs: HashSet<(usize, usize)> = HashSet::new();

    for (index, entry) in palette.iter().enumerate() {
        if index % 512 == 0 {
            check_cancelled(job_id)?;
        }
        let center = spatial_bucket(entry.oklab);
        for bucket in neighbor_buckets(center) {
            let Some(candidates) = buckets.get(&bucket) else {
                continue;
            };
            for &other in candidates {
                if other <= index {
                    continue;
                }
                let pair = (index, other);
                if !compared_pairs.insert(pair) {
                    continue;
                }
                timings.merge_pair_checks += 1;
                if can_merge_oklab_colors(entry.oklab, palette[other].oklab, threshold) {
                    union_find.union(index, other);
                }
            }
        }
    }

    let full_pairs = (color_count as u64) * (color_count as u64 - 1) / 2;
    timings.merge_pair_skips = full_pairs.saturating_sub(timings.merge_pair_checks);

    let mut clusters: HashMap<usize, Vec<usize>> = HashMap::new();
    for idx in 0..color_count {
        let root = union_find.find(idx);
        clusters.entry(root).or_default().push(idx);
    }
    Ok(clusters)
}

pub struct MergeResult {
    pub data: Vec<u8>,
    pub group_count: u32,
}

pub fn apply_oklab_merge_from_palette(
    width: u32,
    height: u32,
    source: &[u8],
    palette_meta: &[PaletteColorMeta],
    threshold: f64,
    reduce_algorithm: &str,
    job_id: u64,
    timings: &mut StageTimings,
) -> Result<MergeResult, String> {
    let threshold = clamp_oklab_merge_threshold(threshold);
    let pixel_count = (width * height) as usize;
    let palette = palette_entries_from_cache(palette_meta);
    let color_count = palette.len();

    if color_count == 0 {
        return Ok(MergeResult {
            data: source.to_vec(),
            group_count: 0,
        });
    }

    let clusters = cluster_palette(&palette, threshold, job_id, timings)?;

    let mut representative_by_color: HashMap<u32, u32> = HashMap::new();
    for member_indices in clusters.values() {
        let cluster_entries: Vec<PaletteEntry> = member_indices
            .iter()
            .map(|&index| PaletteEntry {
                color: palette[index].color,
                pixel_count: palette[index].pixel_count,
                oklab: palette[index].oklab,
            })
            .collect();
        let representative = reduce_cluster_colors(&cluster_entries, reduce_algorithm);
        for entry in &cluster_entries {
            representative_by_color.insert(entry.color, representative);
        }
    }

    let mut result_data = source.to_vec();
    for index in 0..pixel_count {
        if index % 65536 == 0 {
            check_cancelled(job_id)?;
        }
        let source_color = read_pixel_color(source, index);
        if get_alpha(source_color) == 0 {
            continue;
        }
        let merged_color = representative_by_color
            .get(&source_color)
            .copied()
            .unwrap_or(source_color);
        write_pixel_color(
            &mut result_data,
            index,
            merged_color,
            get_alpha(merged_color) == 255,
            get_alpha(source_color),
        );
    }

    Ok(MergeResult {
        data: result_data,
        group_count: clusters.len() as u32,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::color_edit::stats::build_palette_cache;

    fn create_rgba(pixels: &[(u8, u8, u8, u8)]) -> Vec<u8> {
        let mut data = Vec::with_capacity(pixels.len() * 4);
        for (r, g, b, a) in pixels {
            data.extend_from_slice(&[*r, *g, *b, *a]);
        }
        data
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
    fn merges_similar_low_chroma_colors() {
        let source = create_rgba(&[(10, 10, 10, 255), (12, 12, 12, 255), (14, 14, 14, 255)]);
        let cache = build_palette_cache(&source, 3);
        let mut timings = StageTimings::default();
        let result = apply_oklab_merge_from_palette(3, 1, &source, &cache.entries, 0.05, "mode", 0, &mut timings).unwrap();
        assert_eq!(result.group_count, 1);
        let first = pixel_at(&result.data, 3, 0, 0);
        assert_eq!(pixel_at(&result.data, 3, 1, 0), first);
        assert_eq!(pixel_at(&result.data, 3, 2, 0), first);
    }

    #[test]
    fn keeps_distinct_high_chroma_colors_separate() {
        let source = create_rgba(&[(220, 20, 20, 255), (20, 20, 220, 255)]);
        let cache = build_palette_cache(&source, 2);
        let mut timings = StageTimings::default();
        let result = apply_oklab_merge_from_palette(2, 1, &source, &cache.entries, 0.035, "mode", 0, &mut timings).unwrap();
        assert_eq!(result.group_count, 2);
    }

    #[test]
    fn preserves_transparent_pixels() {
        let source = create_rgba(&[(255, 0, 0, 255), (0, 0, 0, 0)]);
        let cache = build_palette_cache(&source, 2);
        let mut timings = StageTimings::default();
        let result = apply_oklab_merge_from_palette(2, 1, &source, &cache.entries, 0.05, "mode", 0, &mut timings).unwrap();
        assert_eq!(pixel_at(&result.data, 2, 1, 0), [0, 0, 0, 0]);
    }
}
