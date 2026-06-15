use std::time::Instant;

#[derive(Debug, Clone, Default)]
pub struct StageTimings {
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

pub struct PipelineTimer {
    started: Instant,
    pub stages: StageTimings,
}

impl PipelineTimer {
    pub fn start() -> Self {
        Self {
            started: Instant::now(),
            stages: StageTimings::default(),
        }
    }

    pub fn elapsed_ms(start: Instant) -> f64 {
        start.elapsed().as_secs_f64() * 1000.0
    }

    pub fn finish(&mut self) {
        self.stages.total_ms = self.started.elapsed().as_secs_f64() * 1000.0;
    }
}

impl StageTimings {
    pub fn log_to_stderr(&self) {
        eprintln!(
            "[color_edit] unique={} after_prefilter={} checks={} skips={} rgb_checks={} total={:.1}ms \
             decode={:.1} palette={:.1} rgb_prefilter={:.1} stats_before={:.1} merge={:.1} manual={:.1} \
             stats_norm={:.1} disable={:.1} stats_after={:.1} encode={:.1}",
            self.unique_count,
            self.unique_count_after_prefilter,
            self.merge_pair_checks,
            self.merge_pair_skips,
            self.rgb_prefilter_pair_checks,
            self.total_ms,
            self.decode_rgba_ms,
            self.palette_build_ms,
            self.rgb_prefilter_ms,
            self.stats_before_ms,
            self.merge_ms,
            self.manual_ms,
            self.stats_after_normalized_ms,
            self.disable_ms,
            self.stats_after_ms,
            self.encode_rgba_ms,
        );
    }
}
