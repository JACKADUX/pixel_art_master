import {

  computeColorPaletteStats,

  type ColorPaletteStats,

} from "@/domain/colorEdit/ColorPaletteStats";

import type { DiffusionRegionGroups } from "@/domain/colorEdit/DiffusionRegionGroups";
import type { ManualMergeAnchor } from "@/domain/colorEdit/ManualMergeAnchor";
import { applyManualMergeOverlays } from "@/domain/colorEdit/ManualMergeOperations";

import { applyOklabMerge } from "@/domain/colorEdit/OklabMergeOperations";

import {

  normalizeOklabMergeOptions,

  type OklabMergeOptions,

} from "@/domain/colorEdit/OklabMergeOptions";

import { rgbaBufferToImageData } from "@/infrastructure/image/ImageDataCodec";



export interface ColorEditResult {

  resultImageData: ImageData;

  statsBefore: ColorPaletteStats;

  statsAfter: ColorPaletteStats;

  regionGroups: DiffusionRegionGroups;

}



export function applyOklabMergeEdit(

  sourceImageData: ImageData,

  options?: Partial<OklabMergeOptions>,

  manualAnchors?: readonly ManualMergeAnchor[],

): ColorEditResult {

  const normalized = normalizeOklabMergeOptions(options);

  const statsBefore = computeColorPaletteStats(sourceImageData);

  const { imageData: processed, regionGroups } = applyOklabMerge(

    sourceImageData,

    normalized,

  );

  const withManualOverlays = applyManualMergeOverlays(
    sourceImageData,
    processed,
    manualAnchors ?? [],
  );

  const resultImageData = rgbaBufferToImageData(

    withManualOverlays.width,

    withManualOverlays.height,

    withManualOverlays.data,

  );

  const statsAfter = computeColorPaletteStats(resultImageData);

  return { resultImageData, statsBefore, statsAfter, regionGroups };

}

