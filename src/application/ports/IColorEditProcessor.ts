import type { PixelColor } from "@/domain/canvas/PixelColor";
import type { ColorPaletteStats } from "@/domain/colorEdit/ColorPaletteStats";
import type { ManualMergeAnchor } from "@/domain/colorEdit/ManualMergeAnchor";
import type { OklabMergeOptions } from "@/domain/colorEdit/OklabMergeOptions";

export interface ColorEditProcessorRequest {
  sourceImageData: ImageData;
  options?: Partial<OklabMergeOptions>;
  manualAnchors?: readonly ManualMergeAnchor[];
  disabledColors?: readonly PixelColor[];
  jobId?: number;
}

export interface ColorEditPerformanceMetrics {
  decodeRgbaMs: number;
  paletteBuildMs: number;
  statsBeforeMs: number;
  mergeMs: number;
  manualMs: number;
  statsAfterNormalizedMs: number;
  disableMs: number;
  statsAfterMs: number;
  encodeRgbaMs: number;
  totalMs: number;
  uniqueCount: number;
  uniqueCountAfterPrefilter?: number;
  rgbPrefilterMs?: number;
  rgbPrefilterPairChecks?: number;
  mergePairChecks: number;
  mergePairSkips: number;
  encodeBase64Ms?: number;
  decodeBase64Ms?: number;
  ipcMs?: number;
}

export interface ColorEditProcessorResult {
  resultImageData: ImageData;
  statsBefore: ColorPaletteStats;
  statsAfterNormalized: ColorPaletteStats;
  statsAfter: ColorPaletteStats;
  mergeGroupCount: number;
  performance?: ColorEditPerformanceMetrics;
}

export interface IColorEditProcessor {
  applyColorEdit(request: ColorEditProcessorRequest): Promise<ColorEditProcessorResult>;
}
