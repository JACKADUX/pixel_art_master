pub const OKLAB_MAX_CHROMA: f64 = 0.4;

pub const WEIGHT_L: f64 = 1.35;
pub const WEIGHT_A: f64 = 1.0;
pub const WEIGHT_B: f64 = 0.875;

pub const HARD_L_LIMIT: f64 = 0.06;

pub const DARK_THRESHOLD_L_START: f64 = 0.05;
pub const DARK_THRESHOLD_L_END: f64 = 0.25;

pub const CHROMA_THRESHOLD_C_START: f64 = 0.15;
pub const CHROMA_THRESHOLD_C_END: f64 = 0.35;

pub const MIN_OKLAB_MERGE_THRESHOLD: f64 = 0.02;
pub const MAX_OKLAB_MERGE_THRESHOLD: f64 = 0.05;

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Oklab {
    pub l: f64,
    pub a: f64,
    pub b: f64,
}

pub fn create_oklab(l: f64, a: f64, b: f64) -> Oklab {
    Oklab {
        l: l.clamp(0.0, 1.0),
        a: a.clamp(-OKLAB_MAX_CHROMA, OKLAB_MAX_CHROMA),
        b: b.clamp(-OKLAB_MAX_CHROMA, OKLAB_MAX_CHROMA),
    }
}

fn srgb_to_linear(channel: u8) -> f64 {
    let c = f64::from(channel) / 255.0;
    if c <= 0.04045 {
        c / 12.92
    } else {
        ((c + 0.055) / 1.055).powf(2.4)
    }
}

pub fn rgb_to_oklab(r: u8, g: u8, b: u8) -> Oklab {
    let lr = srgb_to_linear(r);
    let lg = srgb_to_linear(g);
    let lb = srgb_to_linear(b);

    let l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
    let m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
    let s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;

    let l_root = l.cbrt();
    let m_root = m.cbrt();
    let s_root = s.cbrt();

    create_oklab(
        0.2104542553 * l_root + 0.793617785 * m_root - 0.0040720468 * s_root,
        1.9779984951 * l_root - 2.428592205 * m_root + 0.4505937099 * s_root,
        0.0259040371 * l_root + 0.7827717662 * m_root - 0.808675766 * s_root,
    )
}

pub fn color_to_oklab(color: u32) -> Oklab {
    let r = (color & 0xff) as u8;
    let g = ((color >> 8) & 0xff) as u8;
    let b = ((color >> 16) & 0xff) as u8;
    rgb_to_oklab(r, g, b)
}

pub fn oklab_chroma(c: Oklab) -> f64 {
    (c.a * c.a + c.b * c.b).sqrt()
}

pub fn oklab_chroma_normalized(c: Oklab) -> f64 {
    oklab_chroma(c) / OKLAB_MAX_CHROMA
}

fn smoothstep(edge0: f64, edge1: f64, x: f64) -> f64 {
    let t = ((x - edge0) / (edge1 - edge0)).clamp(0.0, 1.0);
    t * t * (3.0 - 2.0 * t)
}

pub fn weighted_delta_e(a: Oklab, b: Oklab) -> f64 {
    let dl = a.l - b.l;
    let da = a.a - b.a;
    let db = a.b - b.b;
    (WEIGHT_L * dl * dl + WEIGHT_A * da * da + WEIGHT_B * db * db).sqrt()
}

pub fn dark_factor(min_l: f64) -> f64 {
    0.5 + 0.5 * smoothstep(DARK_THRESHOLD_L_START, DARK_THRESHOLD_L_END, min_l)
}

pub fn chroma_factor(max_chroma_normalized: f64) -> f64 {
    let t = smoothstep(
        CHROMA_THRESHOLD_C_START,
        CHROMA_THRESHOLD_C_END,
        max_chroma_normalized,
    );
    1.0 - t * 0.4
}

pub fn effective_oklab_merge_threshold(a: Oklab, b: Oklab, base_threshold: f64) -> f64 {
    let min_l = a.l.min(b.l);
    let max_chroma_norm = oklab_chroma_normalized(a).max(oklab_chroma_normalized(b));
    base_threshold * dark_factor(min_l) * chroma_factor(max_chroma_norm)
}

pub fn can_merge_oklab_colors(a: Oklab, b: Oklab, threshold: f64) -> bool {
    if (a.l - b.l).abs() > HARD_L_LIMIT {
        return false;
    }
    let delta_e = weighted_delta_e(a, b);
    let effective_threshold = effective_oklab_merge_threshold(a, b, threshold);
    delta_e < effective_threshold
}

pub fn clamp_oklab_merge_threshold(value: f64) -> f64 {
    value.clamp(MIN_OKLAB_MERGE_THRESHOLD, MAX_OKLAB_MERGE_THRESHOLD)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn weighted_delta_e_is_zero_for_identical_colors() {
        let c = rgb_to_oklab(128, 64, 32);
        assert!(weighted_delta_e(c, c) < 1e-12);
    }

    #[test]
    fn hard_l_limit_blocks_merge() {
        let dark = rgb_to_oklab(10, 10, 10);
        let light = rgb_to_oklab(240, 240, 240);
        assert!(!can_merge_oklab_colors(dark, light, 0.05));
    }
}
