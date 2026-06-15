import type {
  ColorEditProcessorRequest,
  ColorEditProcessorResult,
  IColorEditProcessor,
} from "@/application/ports/IColorEditProcessor";
import {
  computeColorPaletteStats,
} from "@/domain/colorEdit/ColorPaletteStats";
import {
  applyDisabledColors,
  filterDisabledColorsInPalette,
} from "@/domain/colorEdit/ColorDisableOperations";
import { applyManualMergeOverlays } from "@/domain/colorEdit/ManualMergeOperations";
import { applyOklabMerge } from "@/domain/colorEdit/OklabMergeOperations";
import { normalizeOklabMergeOptions } from "@/domain/colorEdit/OklabMergeOptions";
import { applyRgbPrefilter } from "@/domain/colorEdit/RgbPrefilterOperations";
import {
  assertColorEditNotCancelled,
  clearColorEditCancel,
} from "@/infrastructure/colorEdit/colorEditCancellation";

export class TypeScriptColorEditProcessor implements IColorEditProcessor {
  async applyColorEdit(request: ColorEditProcessorRequest): Promise<ColorEditProcessorResult> {
    const jobId = request.jobId ?? 0;
    assertColorEditNotCancelled(jobId);

    const normalized = normalizeOklabMergeOptions(request.options);
    const manualAnchors = request.manualAnchors ?? [];
    const disabledColors = request.disabledColors ?? [];

    const statsBefore = computeColorPaletteStats(request.sourceImageData);
    assertColorEditNotCancelled(jobId);

    const prefilterStart = performance.now();
    const prefilteredSource = applyRgbPrefilter(
      request.sourceImageData,
      statsBefore.uniqueCount,
    );
    const rgbPrefilterMs = performance.now() - prefilterStart;
    assertColorEditNotCancelled(jobId);

    const { imageData: processed, groupCount } = applyOklabMerge(
      prefilteredSource,
      normalized,
    );
    assertColorEditNotCancelled(jobId);

    const withManualOverlays = applyManualMergeOverlays(
      request.sourceImageData,
      processed,
      manualAnchors,
    );

    const statsAfterNormalized = computeColorPaletteStats(withManualOverlays);
    const activeDisabledColors = filterDisabledColorsInPalette(
      statsAfterNormalized,
      disabledColors,
    );

    const withDisabledColors = applyDisabledColors(withManualOverlays, activeDisabledColors);
    const resultImageData = {
      width: withDisabledColors.width,
      height: withDisabledColors.height,
      data: withDisabledColors.data,
    } as ImageData;
    const statsAfter = computeColorPaletteStats(resultImageData);
    clearColorEditCancel(jobId);

    return {
      resultImageData,
      statsBefore,
      statsAfterNormalized,
      statsAfter,
      mergeGroupCount: groupCount,
      performance: {
        decodeRgbaMs: 0,
        paletteBuildMs: 0,
        statsBeforeMs: 0,
        mergeMs: 0,
        manualMs: 0,
        statsAfterNormalizedMs: 0,
        disableMs: 0,
        statsAfterMs: 0,
        encodeRgbaMs: 0,
        totalMs: 0,
        uniqueCount: statsBefore.uniqueCount,
        uniqueCountAfterPrefilter: computeColorPaletteStats(prefilteredSource).uniqueCount,
        rgbPrefilterMs,
        mergePairChecks: 0,
        mergePairSkips: 0,
      },
    };
  }
}

export const typeScriptColorEditProcessor = new TypeScriptColorEditProcessor();
