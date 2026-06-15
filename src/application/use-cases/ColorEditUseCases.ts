import type {
  ColorEditProcessorRequest,
  ColorEditProcessorResult,
} from "@/application/ports/IColorEditProcessor";
import type { PixelColor } from "@/domain/canvas/PixelColor";
import type { ColorPaletteStats } from "@/domain/colorEdit/ColorPaletteStats";
import type { ManualMergeAnchor } from "@/domain/colorEdit/ManualMergeAnchor";
import type { OklabMergeOptions } from "@/domain/colorEdit/OklabMergeOptions";
import { colorEditProcessor } from "@/infrastructure/colorEdit/createColorEditProcessor";

export interface ColorEditResult {
  resultImageData: ImageData;
  statsBefore: ColorPaletteStats;
  statsAfterNormalized: ColorPaletteStats;
  statsAfter: ColorPaletteStats;
  mergeGroupCount: number;
}

export async function applyOklabMergeEdit(
  sourceImageData: ImageData,
  options?: Partial<OklabMergeOptions>,
  manualAnchors?: readonly ManualMergeAnchor[],
  disabledColors?: readonly PixelColor[],
  jobId?: number,
): Promise<ColorEditResult> {
  const request: ColorEditProcessorRequest = {
    sourceImageData,
    options,
    manualAnchors,
    disabledColors,
    jobId,
  };
  const result: ColorEditProcessorResult = await colorEditProcessor.applyColorEdit(request);
  return {
    resultImageData: result.resultImageData,
    statsBefore: result.statsBefore,
    statsAfterNormalized: result.statsAfterNormalized,
    statsAfter: result.statsAfter,
    mergeGroupCount: result.mergeGroupCount,
  };
}
