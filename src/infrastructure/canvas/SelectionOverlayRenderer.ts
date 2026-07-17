import type { Point } from "@/domain/tool/ITool";
import type { SelectionMask } from "@/domain/selection/SelectionMask";
import { isMaskSelected } from "@/domain/selection/SelectionMask";
import type { SelectionRect } from "@/domain/selection/SelectionRect";
import type { SelectionState } from "@/domain/selection/SelectionState";
import { getEffectiveBounds } from "@/domain/selection/SelectionState";
import {
  hitTestTransformHandleAtBounds,
  TRANSFORM_HANDLE_SIZE,
  type TransformHandle,
} from "@/domain/selection/TransformHandleInteraction";
import {
  type CanvasScreenTransform,
  logicalRectToScreenHeight,
  logicalRectToScreenWidth,
  logicalToScreenX,
  logicalToScreenY,
} from "@/domain/viewport/CanvasScreenTransform";

const MARCH_COLOR = "#ffffff";
const MARCH_SHADOW = "#000000";
const MARCH_DASH_SCREEN_PX = 4;
const HANDLE_SIZE = TRANSFORM_HANDLE_SIZE;

export interface SelectionOverlayOptions {
  selection: SelectionState | null;
  previewRect: SelectionRect | null;
  lassoPoints: Point[] | null;
  phase: number;
  transform: CanvasScreenTransform;
  canvasWidth: number;
  canvasHeight: number;
}

export function renderSelectionOverlay(
  ctx: CanvasRenderingContext2D,
  options: SelectionOverlayOptions,
): void {
  const { selection, previewRect, lassoPoints, phase, transform, canvasWidth, canvasHeight } =
    options;

  if (selection && !selection.floating) {
    renderMaskMarchingAnts(ctx, selection.mask, phase, transform);
  }

  if (selection?.floating) {
    renderMaskMarchingAnts(ctx, selection.mask, phase, transform);
  }

  if (previewRect && previewRect.width > 0 && previewRect.height > 0) {
    renderPreviewRect(ctx, previewRect, transform, phase);
  }

  if (lassoPoints && lassoPoints.length > 1) {
    renderLassoPath(ctx, lassoPoints, transform, phase);
  }

  void canvasWidth;
  void canvasHeight;
}

function renderMaskMarchingAnts(
  ctx: CanvasRenderingContext2D,
  mask: SelectionMask,
  phase: number,
  transform: CanvasScreenTransform,
): void {
  const cell = transform.zoom;
  const dash = MARCH_DASH_SCREEN_PX;
  const offset = phase % (dash * 2);

  for (let y = 0; y < mask.height; y++) {
    for (let x = 0; x < mask.width; x++) {
      if (!isMaskSelected(mask, x, y)) continue;

      const hasTop = y === 0 || !isMaskSelected(mask, x, y - 1);
      const hasBottom = y === mask.height - 1 || !isMaskSelected(mask, x, y + 1);
      const hasLeft = x === 0 || !isMaskSelected(mask, x - 1, y);
      const hasRight = x === mask.width - 1 || !isMaskSelected(mask, x + 1, y);

      const px = logicalToScreenX(x, transform);
      const py = logicalToScreenY(y, transform);

      if (hasTop) drawMarchLine(ctx, px, py, px + cell, py, offset, dash);
      if (hasBottom) drawMarchLine(ctx, px, py + cell, px + cell, py + cell, offset, dash);
      if (hasLeft) drawMarchLine(ctx, px, py, px, py + cell, offset, dash);
      if (hasRight) drawMarchLine(ctx, px + cell, py, px + cell, py + cell, offset, dash);
    }
  }
}

function renderPreviewRect(
  ctx: CanvasRenderingContext2D,
  rect: SelectionRect,
  transform: CanvasScreenTransform,
  phase: number,
): void {
  const x = logicalToScreenX(rect.x, transform);
  const y = logicalToScreenY(rect.y, transform);
  const w = logicalRectToScreenWidth(rect.width, transform);
  const h = logicalRectToScreenHeight(rect.height, transform);

  const dash = MARCH_DASH_SCREEN_PX;
  const offset = phase % (dash * 2);
  drawMarchLine(ctx, x, y, x + w, y, offset, dash);
  drawMarchLine(ctx, x, y + h, x + w, y + h, offset, dash);
  drawMarchLine(ctx, x, y, x, y + h, offset, dash);
  drawMarchLine(ctx, x + w, y, x + w, y + h, offset, dash);
}

function renderLassoPath(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  transform: CanvasScreenTransform,
  phase: number,
): void {
  if (points.length < 2) return;
  const cell = transform.zoom;
  const dash = MARCH_DASH_SCREEN_PX;
  const offset = phase % (dash * 2);

  ctx.beginPath();
  ctx.moveTo(
    logicalToScreenX(points[0].x, transform) + cell / 2,
    logicalToScreenY(points[0].y, transform) + cell / 2,
  );
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(
      logicalToScreenX(points[i].x, transform) + cell / 2,
      logicalToScreenY(points[i].y, transform) + cell / 2,
    );
  }
  ctx.strokeStyle = MARCH_SHADOW;
  ctx.lineWidth = 1;
  ctx.setLineDash([dash, dash]);
  ctx.lineDashOffset = offset;
  ctx.stroke();

  ctx.strokeStyle = MARCH_COLOR;
  ctx.lineDashOffset = offset + dash;
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawMarchLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  offset: number,
  dash: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = MARCH_SHADOW;
  ctx.lineWidth = 1;
  ctx.setLineDash([dash, dash]);
  ctx.lineDashOffset = offset;
  ctx.stroke();

  ctx.strokeStyle = MARCH_COLOR;
  ctx.lineDashOffset = offset + dash;
  ctx.stroke();
  ctx.setLineDash([]);
}

export type { TransformHandle };

export interface TransformOverlayOptions {
  selection: SelectionState;
  transform: CanvasScreenTransform;
  phase: number;
}

export function renderTransformHandles(
  ctx: CanvasRenderingContext2D,
  options: TransformOverlayOptions,
): void {
  const bounds = getEffectiveBounds(options.selection);
  if (bounds.width <= 0 || bounds.height <= 0) return;

  const transform = options.transform;
  const x = logicalToScreenX(bounds.x, transform);
  const y = logicalToScreenY(bounds.y, transform);
  const w = logicalRectToScreenWidth(bounds.width, transform);
  const h = logicalRectToScreenHeight(bounds.height, transform);

  ctx.strokeStyle = "#0066cc";
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);

  const handles: Array<{ hx: number; hy: number }> = [
    { hx: x, hy: y },
    { hx: x + w, hy: y },
    { hx: x + w, hy: y + h },
    { hx: x, hy: y + h },
  ];

  for (const handle of handles) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(
      handle.hx - HANDLE_SIZE / 2,
      handle.hy - HANDLE_SIZE / 2,
      HANDLE_SIZE,
      HANDLE_SIZE,
    );
    ctx.strokeStyle = "#0066cc";
    ctx.strokeRect(
      handle.hx - HANDLE_SIZE / 2,
      handle.hy - HANDLE_SIZE / 2,
      HANDLE_SIZE,
      HANDLE_SIZE,
    );
  }

  const rotateY = y - 20;
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y);
  ctx.lineTo(x + w / 2, rotateY);
  ctx.strokeStyle = "#0066cc";
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(x + w / 2, rotateY, HANDLE_SIZE / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  void options.phase;
}

export function hitTestTransformHandle(
  point: Point,
  selection: SelectionState,
  zoom: number,
): TransformHandle | null {
  const bounds = getEffectiveBounds(selection);
  if (bounds.width <= 0 || bounds.height <= 0) return null;

  return hitTestTransformHandleAtBounds(point, bounds, zoom);
}
