use std::collections::{HashMap, HashSet};

use crate::color_edit::cancel::check_cancelled;
use crate::color_edit::stats::PaletteColorMeta;
use crate::color_edit::timing::StageTimings;

pub const LARGE_IMAGE_UNIQUE_THRESHOLD: u32 = 3000;
pub const RGB_PREFILTER_DISTANCE: u8 = 6;

#[derive(Eq, PartialEq, Hash, Clone, Copy)]
struct RgbBucket {
    r: i32,
    g: i32,
    b: i32,
}

struct PrefilterEntry {
    color: u32,
    pixel_count: u32,
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

fn rgb_distance(a: u32, b: u32) -> f64 {
    let dr = (a & 0xff) as i32 - (b & 0xff) as i32;
    let dg = ((a >> 8) & 0xff) as i32 - ((b >> 8) & 0xff) as i32;
    let db = ((a >> 16) & 0xff) as i32 - ((b >> 16) & 0xff) as i32;
    ((dr * dr + dg * dg + db * db) as f64).sqrt()
}

fn rgb_bucket(color: u32, step: u8) -> RgbBucket {
    let step = i32::from(step.max(1));
    RgbBucket {
        r: (color & 0xff) as i32 / step,
        g: ((color >> 8) & 0xff) as i32 / step,
        b: ((color >> 16) & 0xff) as i32 / step,
    }
}

fn neighbor_rgb_buckets(center: RgbBucket) -> [RgbBucket; 27] {
    let mut buckets = [RgbBucket { r: 0, g: 0, b: 0 }; 27];
    let mut index = 0;
    for dr in -1..=1 {
        for dg in -1..=1 {
            for db in -1..=1 {
                buckets[index] = RgbBucket {
                    r: center.r + dr,
                    g: center.g + dg,
                    b: center.b + db,
                };
                index += 1;
            }
        }
    }
    buckets
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

pub fn should_apply_rgb_prefilter(unique_count: u32) -> bool {
    unique_count > LARGE_IMAGE_UNIQUE_THRESHOLD
}

pub fn apply_rgb_prefilter(
    source: &[u8],
    pixel_count: usize,
    palette_meta: &[PaletteColorMeta],
    rgb_threshold: u8,
    job_id: u64,
    timings: &mut StageTimings,
) -> Result<(Vec<u8>, u32), String> {
    let unique_count = palette_meta.len() as u32;
    if !should_apply_rgb_prefilter(unique_count) {
        return Ok((source.to_vec(), unique_count));
    }

    let palette: Vec<PrefilterEntry> = palette_meta
        .iter()
        .map(|entry| PrefilterEntry {
            color: entry.color,
            pixel_count: entry.count,
        })
        .collect();
    let color_count = palette.len();
    let step = rgb_threshold.max(1);
    let threshold = f64::from(rgb_threshold);

    let mut buckets: HashMap<RgbBucket, Vec<usize>> = HashMap::new();
    for (index, entry) in palette.iter().enumerate() {
        buckets.entry(rgb_bucket(entry.color, step)).or_default().push(index);
    }

    let mut union_find = UnionFind::new(color_count);
    let mut compared_pairs: HashSet<(usize, usize)> = HashSet::new();
    let mut checks = 0u64;

    for (index, entry) in palette.iter().enumerate() {
        if checks % 4096 == 0 {
            check_cancelled(job_id)?;
        }
        for bucket in neighbor_rgb_buckets(rgb_bucket(entry.color, step)) {
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
                checks += 1;
                if rgb_distance(entry.color, palette[other].color) <= threshold {
                    union_find.union(index, other);
                }
            }
        }
    }

    timings.rgb_prefilter_pair_checks = checks;

    let mut clusters: HashMap<usize, Vec<usize>> = HashMap::new();
    for idx in 0..color_count {
        let root = union_find.find(idx);
        clusters.entry(root).or_default().push(idx);
    }

    let mut representative_by_color: HashMap<u32, u32> = HashMap::new();
    for member_indices in clusters.values() {
        let representative = member_indices
            .iter()
            .map(|&index| &palette[index])
            .max_by_key(|entry| entry.pixel_count)
            .map(|entry| entry.color)
            .unwrap_or(0);
        for &index in member_indices {
            representative_by_color.insert(palette[index].color, representative);
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
        let merged = representative_by_color
            .get(&source_color)
            .copied()
            .unwrap_or(source_color);
        write_pixel_color(
            &mut result_data,
            index,
            merged,
            get_alpha(merged) == 255,
            get_alpha(source_color),
        );
    }

    let unique_after = clusters.len() as u32;
    Ok((result_data, unique_after))
}
