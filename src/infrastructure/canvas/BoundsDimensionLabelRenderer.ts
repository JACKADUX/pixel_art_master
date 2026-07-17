import type { SelectionRect } from "@/domain/selection/SelectionRect";
import type { CanvasScreenTransform } from "@/domain/viewport/CanvasScreenTransform";
import {
  computeBoundsLabelScreenPosition,
  formatPixelDimensions,
} from "@/domain/viewport/OverlayLabelLayout";

export function renderBoundsDimensionLabel(
  ctx: CanvasRenderingContext2D,
  rect: SelectionRect,
  transform: CanvasScreenTransform,
): void {
  const { left, top } = computeBoundsLabelScreenPosition(rect, transform);
  const text = formatPixelDimensions(rect.width, rect.height);

  ctx.save();
  ctx.font = "500 11px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;
  const textHeight = Math.max(
    metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent,
    metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent,
    11,
  );
  const padX = 6;
  const padY = 2;
  const boxW = textWidth + padX * 2;
  const boxH = textHeight + padY * 2;
  const boxX = left - boxW / 2;
  const boxY = top;
  const centerY = boxY + boxH / 2;

  ctx.fillStyle = "rgba(24, 24, 27, 0.9)";
  ctx.strokeStyle = "rgba(59, 130, 246, 0.4)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, boxH, 4);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#93c5fd";
  ctx.fillText(text, left, centerY);
  ctx.restore();
}
