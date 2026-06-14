import {
  computeColorPaletteStats,
  type ColorPaletteStats,
} from "@/domain/colorEdit/ColorPaletteStats";
import { applyColorMerge } from "@/domain/colorEdit/ColorMergeOperations";
import type { ColorMergeAnchor } from "@/domain/colorEdit/ColorMergeAnchor";
import {
  normalizeColorMergeOptions,
  type ColorMergeOptions,
} from "@/domain/colorEdit/ColorMergeOptions";
import { rgbaBufferToImageData } from "@/infrastructure/image/ImageDataCodec";

export interface ColorMergeResult {
  resultImageData: ImageData;
  statsBefore: ColorPaletteStats;
  statsAfter: ColorPaletteStats;
}

export function applyColorMergeEdit(
  sourceImageData: ImageData,
  anchors: readonly ColorMergeAnchor[],
  options?: Partial<ColorMergeOptions>,
): ColorMergeResult {
  const normalized = normalizeColorMergeOptions(options);
  const statsBefore = computeColorPaletteStats(sourceImageData);
  const processed = applyColorMerge(sourceImageData, anchors, normalized);
  const resultImageData = rgbaBufferToImageData(
    processed.width,
    processed.height,
    processed.data,
  );
  const statsAfter = computeColorPaletteStats(resultImageData);
  return { resultImageData, statsBefore, statsAfter };
}
