import type { PixelColor } from "@/domain/canvas/PixelColor";
import { getAlpha, toRgbaComponents } from "@/domain/canvas/PixelColor";
import { collectStampBoundaryPolygon, forEachStampPixel } from "@/domain/tool/BrushStamp";
import type { BrushShape } from "@/domain/tool/ToolType";
import type { Point } from "@/domain/tool/ITool";

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
  zoom: number,
): void {
  if (polygon.length === 0) return;

  ctx.beginPath();
  ctx.moveTo(polygon[0].x * zoom + 0.5, polygon[0].y * zoom + 0.5);
  for (let i = 1; i < polygon.length; i++) {
    ctx.lineTo(polygon[i].x * zoom + 0.5, polygon[i].y * zoom + 0.5);
  }
  ctx.closePath();
}

function renderFilledStamp(
  ctx: CanvasRenderingContext2D,
  center: Point,
  size: number,
  shape: BrushShape,
  color: PixelColor,
  zoom: number,
): void {
  ctx.fillStyle = pixelColorToCss(color);
  forEachStampPixel(center, size, shape, (x, y) => {
    ctx.fillRect(x * zoom, y * zoom, zoom, zoom);
  });
}

function renderOutlineStamp(
  ctx: CanvasRenderingContext2D,
  center: Point,
  size: number,
  shape: BrushShape,
  zoom: number,
): void {
  const polygon = collectStampBoundaryPolygon(center, size, shape);
  if (polygon.length === 0) return;

  strokeContrastPath(ctx, () => drawBoundaryPolygon(ctx, polygon, zoom));
}

export function renderBrushStampPreview(
  ctx: CanvasRenderingContext2D,
  center: Point,
  size: number,
  shape: BrushShape,
  color: PixelColor | null,
  zoom: number,
  _bounds: GridBounds,
): void {
  ctx.imageSmoothingEnabled = false;

  if (color && getAlpha(color) > 0) {
    renderFilledStamp(ctx, center, size, shape, color, zoom);
    return;
  }

  renderOutlineStamp(ctx, center, size, shape, zoom);
}
