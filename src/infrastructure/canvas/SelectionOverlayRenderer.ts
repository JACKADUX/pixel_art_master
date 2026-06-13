import type { Point } from "@/domain/tool/ITool";
import type { SelectionMask } from "@/domain/selection/SelectionMask";
import { isMaskSelected } from "@/domain/selection/SelectionMask";
import type { SelectionRect } from "@/domain/selection/SelectionRect";
import type { SelectionState } from "@/domain/selection/SelectionState";
import { getEffectiveBounds } from "@/domain/selection/SelectionState";

const MARCH_COLOR = "#ffffff";
const MARCH_SHADOW = "#000000";
const FILL_COLOR = "rgba(0, 120, 215, 0.15)";

export interface SelectionOverlayOptions {
  selection: SelectionState | null;
  previewRect: SelectionRect | null;
  lassoPoints: Point[] | null;
  phase: number;
  zoom: number;
  canvasWidth: number;
  canvasHeight: number;
}

export function renderSelectionOverlay(
  ctx: CanvasRenderingContext2D,
  options: SelectionOverlayOptions,
): void {
  const { selection, previewRect, lassoPoints, phase, zoom, canvasWidth, canvasHeight } =
    options;

  if (selection && !selection.floating) {
    renderMaskFill(ctx, selection.mask, zoom);
    renderMaskMarchingAnts(ctx, selection.mask, phase, zoom);
  }

  if (selection?.floating) {
    renderMaskFill(ctx, selection.mask, zoom);
    renderMaskMarchingAnts(ctx, selection.mask, phase, zoom);
  }

  if (previewRect && previewRect.width > 0 && previewRect.height > 0) {
    renderPreviewRect(ctx, previewRect, zoom, phase);
  }

  if (lassoPoints && lassoPoints.length > 1) {
    renderLassoPath(ctx, lassoPoints, zoom, phase);
  }

  void canvasWidth;
  void canvasHeight;
}

function renderMaskFill(
  ctx: CanvasRenderingContext2D,
  mask: SelectionMask,
  zoom: number,
): void {
  ctx.fillStyle = FILL_COLOR;
  for (let y = 0; y < mask.height; y++) {
    for (let x = 0; x < mask.width; x++) {
      if (!isMaskSelected(mask, x, y)) continue;
      ctx.fillRect(x * zoom, y * zoom, zoom, zoom);
    }
  }
}

function renderMaskMarchingAnts(
  ctx: CanvasRenderingContext2D,
  mask: SelectionMask,
  phase: number,
  zoom: number,
): void {
  const dash = 4;
  const offset = phase % (dash * 2);

  for (let y = 0; y < mask.height; y++) {
    for (let x = 0; x < mask.width; x++) {
      if (!isMaskSelected(mask, x, y)) continue;

      const hasTop = y === 0 || !isMaskSelected(mask, x, y - 1);
      const hasBottom = y === mask.height - 1 || !isMaskSelected(mask, x, y + 1);
      const hasLeft = x === 0 || !isMaskSelected(mask, x - 1, y);
      const hasRight = x === mask.width - 1 || !isMaskSelected(mask, x + 1, y);

      const px = x * zoom;
      const py = y * zoom;

      if (hasTop) drawMarchLine(ctx, px, py, px + zoom, py, offset, dash);
      if (hasBottom) drawMarchLine(ctx, px, py + zoom, px + zoom, py + zoom, offset, dash);
      if (hasLeft) drawMarchLine(ctx, px, py, px, py + zoom, offset, dash);
      if (hasRight) drawMarchLine(ctx, px + zoom, py, px + zoom, py + zoom, offset, dash);
    }
  }
}

function renderPreviewRect(
  ctx: CanvasRenderingContext2D,
  rect: SelectionRect,
  zoom: number,
  phase: number,
): void {
  const x = rect.x * zoom;
  const y = rect.y * zoom;
  const w = rect.width * zoom;
  const h = rect.height * zoom;

  ctx.fillStyle = FILL_COLOR;
  ctx.fillRect(x, y, w, h);

  const dash = 4;
  const offset = phase % (dash * 2);
  drawMarchLine(ctx, x, y, x + w, y, offset, dash);
  drawMarchLine(ctx, x, y + h, x + w, y + h, offset, dash);
  drawMarchLine(ctx, x, y, x, y + h, offset, dash);
  drawMarchLine(ctx, x + w, y, x + w, y + h, offset, dash);
}

function renderLassoPath(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  zoom: number,
  phase: number,
): void {
  if (points.length < 2) return;
  const dash = 4;
  const offset = phase % (dash * 2);

  ctx.beginPath();
  ctx.moveTo(points[0].x * zoom + zoom / 2, points[0].y * zoom + zoom / 2);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x * zoom + zoom / 2, points[i].y * zoom + zoom / 2);
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

export type TransformHandle =
  | "topLeft"
  | "top"
  | "topRight"
  | "right"
  | "bottomRight"
  | "bottom"
  | "bottomLeft"
  | "left"
  | "rotate"
  | "move";

export interface TransformOverlayOptions {
  selection: SelectionState;
  zoom: number;
  phase: number;
}

const HANDLE_SIZE = 6;

export function renderTransformHandles(
  ctx: CanvasRenderingContext2D,
  options: TransformOverlayOptions,
): void {
  const bounds = getEffectiveBounds(options.selection);
  if (bounds.width <= 0 || bounds.height <= 0) return;

  const x = bounds.x * options.zoom;
  const y = bounds.y * options.zoom;
  const w = bounds.width * options.zoom;
  const h = bounds.height * options.zoom;

  ctx.strokeStyle = "#0066cc";
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);

  const handles: Array<{ hx: number; hy: number }> = [
    { hx: x, hy: y },
    { hx: x + w / 2, hy: y },
    { hx: x + w, hy: y },
    { hx: x + w, hy: y + h / 2 },
    { hx: x + w, hy: y + h },
    { hx: x + w / 2, hy: y + h },
    { hx: x, hy: y + h },
    { hx: x, hy: y + h / 2 },
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

  const x = bounds.x;
  const y = bounds.y;
  const w = bounds.width;
  const h = bounds.height;
  const threshold = Math.max(1, Math.ceil(HANDLE_SIZE / zoom / 2));

  const handles: Array<{ id: TransformHandle; hx: number; hy: number }> = [
    { id: "topLeft", hx: x, hy: y },
    { id: "top", hx: x + w / 2, hy: y },
    { id: "topRight", hx: x + w, hy: y },
    { id: "right", hx: x + w, hy: y + h / 2 },
    { id: "bottomRight", hx: x + w, hy: y + h },
    { id: "bottom", hx: x + w / 2, hy: y + h },
    { id: "bottomLeft", hx: x, hy: y + h },
    { id: "left", hx: x, hy: y + h / 2 },
    { id: "rotate", hx: x + w / 2, hy: y - Math.round(20 / zoom) },
  ];

  for (const handle of handles) {
    if (
      Math.abs(point.x - handle.hx) <= threshold &&
      Math.abs(point.y - handle.hy) <= threshold
    ) {
      return handle.id;
    }
  }

  if (
    point.x >= x &&
    point.x < x + w &&
    point.y >= y &&
    point.y < y + h
  ) {
    return "move";
  }

  return null;
}
