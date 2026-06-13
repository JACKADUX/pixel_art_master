import type { Point } from "@/domain/tool/ITool";
import type { SelectionRect } from "@/domain/selection/SelectionRect";
import { normalizeRect } from "@/domain/selection/SelectionRect";

export function formatPixelDimensions(width: number, height: number): string {
  return `${width} × ${height}`;
}

export function computeBoundsLabelPosition(
  rect: SelectionRect,
  zoom: number,
  gap = 6,
): { left: number; top: number } {
  return {
    left: rect.x * zoom + (rect.width * zoom) / 2,
    top: rect.y * zoom + rect.height * zoom + gap,
  };
}

export function computeGridRelativeLabelPosition(
  cellOrigin: { x: number; y: number },
  _cellSize: number,
  zoom: number,
): { left: number; top: number } {
  return {
    left: cellOrigin.x * zoom,
    top: cellOrigin.y * zoom,
  };
}

export function computeSecondaryGridCellScreenBounds(
  canvasRect: { left: number; top: number },
  cellOrigin: { x: number; y: number },
  cellSize: number,
  zoom: number,
): { left: number; top: number; width: number; height: number } {
  const displayCellSize = Math.max(1, cellSize);
  const local = computeGridRelativeLabelPosition(cellOrigin, displayCellSize, zoom);
  return {
    left: canvasRect.left + local.left,
    top: canvasRect.top + local.top,
    width: displayCellSize * zoom,
    height: displayCellSize * zoom,
  };
}

export function computeGridRelativeLabelScreenPosition(
  canvasRect: { left: number; top: number },
  cellOrigin: { x: number; y: number },
  cellSize: number,
  zoom: number,
): { left: number; top: number } {
  const local = computeGridRelativeLabelPosition(cellOrigin, cellSize, zoom);
  return {
    left: canvasRect.left + local.left,
    top: canvasRect.top + local.top,
  };
}

export function normalizeDragRect(from: Point, to: Point): SelectionRect {
  return normalizeRect(from.x, from.y, to.x, to.y);
}
