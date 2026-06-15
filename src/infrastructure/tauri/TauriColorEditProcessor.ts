import { invoke } from "@tauri-apps/api/core";
import type {
  ColorEditPerformanceMetrics,
  ColorEditProcessorRequest,
  ColorEditProcessorResult,
  IColorEditProcessor,
} from "@/application/ports/IColorEditProcessor";
import { toHexAlpha, type PixelColor } from "@/domain/canvas/PixelColor";
import type { ColorPaletteStats } from "@/domain/colorEdit/ColorPaletteStats";
import { normalizeOklabMergeOptions } from "@/domain/colorEdit/OklabMergeOptions";
import { rgbaBufferToImageData } from "@/infrastructure/image/ImageDataCodec";
import {
  decodeBase64ToRgba,
  encodeRgbaToBase64,
} from "@/infrastructure/image/RgbaBase64Codec";

interface RustColorEntry {
  color: number;
  count: number;
}

interface RustPaletteStats {
  unique_count: number;
  colors: RustColorEntry[];
}

interface RustColorEditPerformance {
  decode_rgba_ms: number;
  palette_build_ms: number;
  stats_before_ms: number;
  rgb_prefilter_ms: number;
  merge_ms: number;
  manual_ms: number;
  stats_after_normalized_ms: number;
  disable_ms: number;
  stats_after_ms: number;
  encode_rgba_ms: number;
  total_ms: number;
  unique_count: number;
  unique_count_after_prefilter: number;
  rgb_prefilter_pair_checks: number;
  merge_pair_checks: number;
  merge_pair_skips: number;
}

interface RustColorEditResponse {
  result_rgba_base64: string;
  stats_before: RustPaletteStats;
  stats_after_normalized: RustPaletteStats;
  stats_after: RustPaletteStats;
  merge_group_count: number;
  performance: RustColorEditPerformance;
}

function toRustStats(stats: RustPaletteStats): ColorPaletteStats {
  return {
    uniqueCount: stats.unique_count,
    colors: stats.colors.map((entry) => ({
      color: entry.color as PixelColor,
      hex: toHexAlpha(entry.color as PixelColor),
    })),
  };
}

function toPerformanceMetrics(
  performance: RustColorEditPerformance,
  frontend: Pick<
    ColorEditPerformanceMetrics,
    "encodeBase64Ms" | "decodeBase64Ms" | "ipcMs"
  >,
): ColorEditPerformanceMetrics {
  return {
    decodeRgbaMs: performance.decode_rgba_ms,
    paletteBuildMs: performance.palette_build_ms,
    statsBeforeMs: performance.stats_before_ms,
    rgbPrefilterMs: performance.rgb_prefilter_ms,
    mergeMs: performance.merge_ms,
    manualMs: performance.manual_ms,
    statsAfterNormalizedMs: performance.stats_after_normalized_ms,
    disableMs: performance.disable_ms,
    statsAfterMs: performance.stats_after_ms,
    encodeRgbaMs: performance.encode_rgba_ms,
    totalMs: performance.total_ms,
    uniqueCount: performance.unique_count,
    uniqueCountAfterPrefilter: performance.unique_count_after_prefilter,
    rgbPrefilterPairChecks: performance.rgb_prefilter_pair_checks,
    mergePairChecks: performance.merge_pair_checks,
    mergePairSkips: performance.merge_pair_skips,
    ...frontend,
  };
}

function logPerformance(metrics: ColorEditPerformanceMetrics): void {
  console.debug("[color_edit] performance", metrics);
}

export class TauriColorEditProcessor implements IColorEditProcessor {
  async applyColorEdit(request: ColorEditProcessorRequest): Promise<ColorEditProcessorResult> {
    const normalized = normalizeOklabMergeOptions(request.options);
    const { width, height, data } = request.sourceImageData;

    const encodeStart = performance.now();
    const rgbaBase64 = encodeRgbaToBase64(data);
    const encodeBase64Ms = performance.now() - encodeStart;

    const ipcStart = performance.now();
    const response = await invoke<RustColorEditResponse>("apply_color_edit", {
      request: {
        width,
        height,
        rgba_base64: rgbaBase64,
        threshold: normalized.threshold,
        reduce_algorithm: normalized.reduceAlgorithm,
        manual_anchors: (request.manualAnchors ?? []).map((anchor) => ({
          color: anchor.color,
          threshold: anchor.threshold,
        })),
        disabled_colors: request.disabledColors ?? [],
        job_id: request.jobId ?? 0,
      },
    });
    const ipcMs = performance.now() - ipcStart;

    const decodeStart = performance.now();
    const decodedRgba = decodeBase64ToRgba(response.result_rgba_base64);
    const decodeBase64Ms = performance.now() - decodeStart;

    const performanceMetrics = toPerformanceMetrics(response.performance, {
      encodeBase64Ms,
      decodeBase64Ms,
      ipcMs,
    });
    logPerformance(performanceMetrics);

    return {
      resultImageData: rgbaBufferToImageData(width, height, decodedRgba),
      statsBefore: toRustStats(response.stats_before),
      statsAfterNormalized: toRustStats(response.stats_after_normalized),
      statsAfter: toRustStats(response.stats_after),
      mergeGroupCount: response.merge_group_count,
      performance: performanceMetrics,
    };
  }
}

export const tauriColorEditProcessor = new TauriColorEditProcessor();
