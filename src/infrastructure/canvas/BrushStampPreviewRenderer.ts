import type { PixelColor } from "@/domain/canvas/PixelColor";
import { getAlpha, toRgbaComponents } from "@/domain/canvas/PixelColor";
import { collectStampBoundaryPolygon, forEachStampPixel } from "@/domain/tool/BrushStamp";
import type { BrushShape } from "@/domain/tool/ToolType";
import type { Point } from "@/domain/tool/ITool";
import {
  type CanvasScreenTransform,
  logicalToScreenX,
  logicalToScreenY,
} from "@/domain/viewport/CanvasScreenTransform";

interface GridBounds {
  width: number;
  height: number;
}

function pixelColorToCss(color: PixelColor): string {
  const { r, g, b, a } = toRgbaComponents(color);
  return `rgba(${r}, ${g}, ${b}, ${a / 255})`;
}

function strokeContrastPath(ctx: CanvasRenderingContext2D, draw: () => void): void {
  ctx.lineWidth = 1;
  ctx.strokeStyle = "#000000";
  draw();
  ctx.stroke();
  ctx.strokeStyle = "#ffffff";
  draw();
  ctx.stroke();
}

function drawBoundaryPolygon(
  ctx: CanvasRenderingContext2D,
  polygon: Point[],
  transform: CanvasScreenTransform,
): void {
  if (polygon.length === 0) return;

  ctx.beginPath();
  ctx.moveTo(
    logicalToScreenX(polygon[0].x, transform) + 0.5,
    logicalToScreenY(polygon[0].y, transform) + 0.5,
  );
  for (let i = 1; i < polygon.length; i++) {
    ctx.lineTo(
      logicalToScreenX(polygon[i].x, transform) + 0.5,
      logicalToScreenY(polygon[i].y, transform) + 0.5,
    );
  }
  ctx.closePath();
}

function renderFilledStamp(
  ctx: CanvasRenderingContext2D,
  center: Point,
  size: number,
  shape: BrushShape,
  color: PixelColor,
  transform: CanvasScreenTransform,
): void {
  const cell = transform.zoom;
  ctx.fillStyle = pixelColorToCss(color);
  forEachStampPixel(center, size, shape, (x, y) => {
    ctx.fillRect(logicalToScreenX(x, transform), logicalToScreenY(y, transform), cell, cell);
  });
}

function renderOutlineStamp(
  ctx: CanvasRenderingContext2D,
  center: Point,
  size: number,
  shape: BrushShape,
  transform: CanvasScreenTransform,
): void {
  const polygon = collectStampBoundaryPolygon(center, size, shape);
  if (polygon.length === 0) return;

  strokeContrastPath(ctx, () => drawBoundaryPolygon(ctx, polygon, transform));
}

export function renderBrushStampPreview(
  ctx: CanvasRenderingContext2D,
  center: Point,
  size: number,
  shape: BrushShape,
  color: PixelColor | null,
  transform: CanvasScreenTransform,
  _bounds: GridBounds,
): void {
  ctx.imageSmoothingEnabled = false;

  if (color && getAlpha(color) > 0) {
    renderFilledStamp(ctx, center, size, shape, color, transform);
    return;
  }

  renderOutlineStamp(ctx, center, size, shape, transform);
}
