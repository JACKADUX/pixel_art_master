import type { Point } from "@/domain/tool/ITool";
import type { SelectionRect } from "@/domain/selection/SelectionRect";
import { normalizeRect } from "@/domain/selection/SelectionRect";
import type { CanvasScreenTransform } from "@/domain/viewport/CanvasScreenTransform";
import { logicalRectToScreenHeight, logicalRectToScreenWidth, logicalToScreenX, logicalToScreenY } from "@/domain/viewport/CanvasScreenTransform";

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

export function computeBoundsLabelScreenPosition(
  rect: SelectionRect,
  transform: CanvasScreenTransform,
  gap = 6,
): { left: number; top: number } {
  return {
    left: logicalToScreenX(rect.x, transform) + logicalRectToScreenWidth(rect.width, transform) / 2,
    top: logicalToScreenY(rect.y, transform) + logicalRectToScreenHeight(rect.height, transform) + gap,
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
  return computeSecondaryGridCellScreenBoundsWithSpans(
    canvasRect,
    cellOrigin,
    cellSize,
    cellSize,
    zoom,
  );
}

export function computeSecondaryGridCellScreenBoundsWithSpans(
  canvasRect: { left: number; top: number },
  cellOrigin: { x: number; y: number },
  spanX: number,
  spanY: number,
  zoom: number,
): { left: number; top: number; width: number; height: number } {
  const displaySpanX = Math.max(1, spanX);
  const displaySpanY = Math.max(1, spanY);
  const local = computeGridRelativeLabelPosition(cellOrigin, displaySpanX, zoom);
  return {
    left: canvasRect.left + local.left,
    top: canvasRect.top + cellOrigin.y * zoom,
    width: displaySpanX * zoom,
    height: displaySpanY * zoom,
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
