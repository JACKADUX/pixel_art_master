import type { WritableCanvasSurface } from "@/domain/canvas/MaskedPixelGrid";
import type { PixelGrid } from "@/domain/canvas/PixelGrid";
import { cropPixelGridToOpaqueBounds } from "@/domain/patternBrush/PatternBrushCrop";
import { getEffectiveSelectionMask } from "@/domain/selection/FloatingSelectionLifecycle";
import { isMaskEmpty } from "@/domain/selection/SelectionMask";
import { extractMaskedRegionAsGrid } from "@/domain/selection/SelectionMaskOperations";
import type { SelectionRect } from "@/domain/selection/SelectionRect";
import {
  isSelectionEmpty,
  type SelectionState,
} from "@/domain/selection/SelectionState";
import type { Point } from "@/domain/tool/ITool";
import type { ToolSettings } from "@/domain/tool/ToolType";
import {
  createSelectionFromDrag,
  createSelectionFromLasso,
} from "./SelectionUseCases";

import type { SelectionDragState } from "@/presentation/controllers/canvasInteraction";

export interface PatternBrushSelectionContext {
  selection: SelectionState | null;
  selectionDrag: Pick<SelectionDragState, "start" | "current" | "mode"> | null;
  lassoPoints: Point[];
  toolSettings: Pick<ToolSettings, "selectionMode">;
  canvasWidth: number;
  canvasHeight: number;
}

export function resolvePatternBrushSelectionState(
  context: PatternBrushSelectionContext,
): SelectionState | null {
  const pending = resolvePendingCreateSelection(context);
  if (pending && !isSelectionEmpty(pending)) return pending;

  const { selection } = context;
  if (!selection || isSelectionEmpty(selection)) return null;
  return selection;
}

function resolvePendingCreateSelection(
  context: PatternBrushSelectionContext,
): SelectionState | null {
  const {
    selectionDrag,
    lassoPoints,
    toolSettings,
    selection,
    canvasWidth,
    canvasHeight,
  } = context;

  if (!selectionDrag || selectionDrag.mode !== "create") return null;

  const dragged =
    selectionDrag.start.x !== selectionDrag.current.x ||
    selectionDrag.start.y !== selectionDrag.current.y;
  if (!dragged) return null;

  if (toolSettings.selectionMode === "lasso") {
    if (lassoPoints.length < 3) return null;
    return createSelectionFromLasso(
      lassoPoints,
      canvasWidth,
      canvasHeight,
      selection,
      false,
      false,
    );
  }

  if (toolSettings.selectionMode === "magicWand") return null;

  return createSelectionFromDrag(
    selectionDrag.start,
    selectionDrag.current,
    canvasWidth,
    canvasHeight,
    toolSettings as ToolSettings,
    selection,
    false,
    false,
  );
}

export function extractPatternBrushPixelsFromSelection(
  grid: WritableCanvasSurface,
  selection: SelectionState,
): PixelGrid | null {
  if (selection.floating) {
    return cropPixelGridToOpaqueBounds(selection.floating.pixels);
  }

  const mask = getEffectiveSelectionMask(selection);
  if (!mask || isMaskEmpty(mask)) return null;

  const region = extractMaskedRegionAsGrid(grid, mask);
  if (!region) return null;
  return cropPixelGridToOpaqueBounds(region);
}

export function resolvePatternBrushPreviewRect(
  context: PatternBrushSelectionContext,
): SelectionRect | null {
  const selection = resolvePatternBrushSelectionState(context);
  if (!selection || isSelectionEmpty(selection)) return null;
  if (selection.floating) {
    return {
      x: selection.floating.offset.x,
      y: selection.floating.offset.y,
      width: selection.floating.pixels.width,
      height: selection.floating.pixels.height,
    };
  }
  return selection.bounds.width > 0 && selection.bounds.height > 0
    ? selection.bounds
    : null;
}
