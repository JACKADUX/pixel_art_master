import type { PixelGrid } from "@/domain/canvas/PixelGrid";
import { joinPath } from "@/domain/asset/AssetLibraryPaths";
import { cropPixelGridToOpaqueBounds } from "@/domain/patternBrush/PatternBrushCrop";
import {
  getActiveLayerGrid,
  getCompositeGrid,
  type Project,
} from "@/domain/project/Project";
import { getEffectiveSelectionMask } from "@/domain/selection/FloatingSelectionLifecycle";
import { isMaskEmpty } from "@/domain/selection/SelectionMask";
import { extractMaskedRegionAsGrid } from "@/domain/selection/SelectionMaskOperations";
import { scaleGrid } from "@/domain/selection/PixelTransform";
import {
  isSelectionEmpty,
  type SelectionState,
} from "@/domain/selection/SelectionState";
import {
  getImageExportExtension,
  MAX_CUSTOM_LONGEST_EDGE,
  MIN_CUSTOM_LONGEST_EDGE,
  type ImageExportFormat,
  type ImageExportScalePreset,
  type ImageExportScope,
} from "./ImageExportPreferences";

const INVALID_FILE_NAME_CHARS = /[<>:"/\\|?*\x00-\x1f]/g;

export function sanitizeExportFileName(name: string): string {
  const trimmed = name.trim().replace(INVALID_FILE_NAME_CHARS, "").replace(/\.+$/g, "");
  return trimmed.length > 0 ? trimmed : "export";
}

export function buildExportFilePath(
  directory: string,
  fileName: string,
  format: ImageExportFormat,
): string {
  const safeName = sanitizeExportFileName(fileName);
  const ext = getImageExportExtension(format);
  return joinPath(directory, `${safeName}.${ext}`);
}

export function resolveExportPixelGrid(
  project: Project,
  scope: ImageExportScope,
  selection: SelectionState | null,
): PixelGrid | null {
  switch (scope) {
    case "project":
      return getCompositeGrid(project);
    case "layer":
      return getActiveLayerGrid(project);
    case "selection": {
      if (!selection || isSelectionEmpty(selection)) return null;
      const grid = getActiveLayerGrid(project);
      if (selection.floating) {
        return cropPixelGridToOpaqueBounds(selection.floating.pixels);
      }
      const mask = getEffectiveSelectionMask(selection);
      if (!mask || isMaskEmpty(mask)) return null;
      const region = extractMaskedRegionAsGrid(grid, mask);
      if (!region) return null;
      return cropPixelGridToOpaqueBounds(region);
    }
    default:
      return null;
  }
}

export function resolveTargetLongestEdge(
  grid: PixelGrid,
  scalePreset: ImageExportScalePreset,
  customLongestEdge: number,
): number {
  const current = Math.max(grid.width, grid.height);
  switch (scalePreset) {
    case "original":
      return current;
    case "256":
      return 256;
    case "512":
      return 512;
    case "1024":
      return 1024;
    case "custom":
      return clampLongestEdge(customLongestEdge);
    default:
      return current;
  }
}

function clampLongestEdge(value: number): number {
  if (!Number.isFinite(value)) return MIN_CUSTOM_LONGEST_EDGE;
  return Math.min(
    Math.max(Math.round(value), MIN_CUSTOM_LONGEST_EDGE),
    MAX_CUSTOM_LONGEST_EDGE,
  );
}

export function scalePixelGridToLongestEdge(
  grid: PixelGrid,
  targetLongestEdge: number,
): PixelGrid {
  const currentLongest = Math.max(grid.width, grid.height);
  if (targetLongestEdge <= 0 || targetLongestEdge === currentLongest) {
    return grid;
  }

  const scale = targetLongestEdge / currentLongest;
  return scaleGrid(grid, scale, scale, "topLeft");
}

export function computeExportDimensions(
  grid: PixelGrid,
  scalePreset: ImageExportScalePreset,
  customLongestEdge: number,
): { sourceWidth: number; sourceHeight: number; outputWidth: number; outputHeight: number } {
  const targetLongest = resolveTargetLongestEdge(grid, scalePreset, customLongestEdge);
  const currentLongest = Math.max(grid.width, grid.height);
  if (targetLongest === currentLongest) {
    return {
      sourceWidth: grid.width,
      sourceHeight: grid.height,
      outputWidth: grid.width,
      outputHeight: grid.height,
    };
  }

  const scale = targetLongest / currentLongest;
  return {
    sourceWidth: grid.width,
    sourceHeight: grid.height,
    outputWidth: Math.max(1, Math.round(grid.width * scale)),
    outputHeight: Math.max(1, Math.round(grid.height * scale)),
  };
}
