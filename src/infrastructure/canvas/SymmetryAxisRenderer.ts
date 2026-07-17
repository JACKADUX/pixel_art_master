import { symmetryAxisColorRgba } from "@/domain/appSettings/AppSettings";
import type { SymmetryConfig } from "@/domain/symmetry/SymmetryConfig";
import { isSymmetryActive } from "@/domain/symmetry/SymmetryConfig";
import { symmetryAxisCoord } from "@/domain/symmetry/SymmetryMirror";
import {
  type CanvasScreenTransform,
  logicalRectToScreenHeight,
  logicalRectToScreenWidth,
  logicalToScreenX,
  logicalToScreenY,
} from "@/domain/viewport/CanvasScreenTransform";

export interface SymmetryAxisStyle {
  visible: boolean;
  colorHex: string;
  lineWidth: number;
  outlineEnabled: boolean;
}

export interface SymmetryAxisRenderOptions {
  config: SymmetryConfig;
  transform: CanvasScreenTransform;
  canvasWidth: number;
  canvasHeight: number;
  style: SymmetryAxisStyle;
}

function strokeAxisLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  style: SymmetryAxisStyle,
): void {
  ctx.setLineDash([8, 4]);
  ctx.lineCap = "round";

  const mainWidth = style.lineWidth;
  const outlineWidth = mainWidth + 2;
  const color = symmetryAxisColorRgba(style.colorHex);

  if (style.outlineEnabled) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineWidth = outlineWidth;
    ctx.strokeStyle = "rgba(0, 0, 0, 0.75)";
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineWidth = mainWidth;
  ctx.strokeStyle = color;
  ctx.stroke();
}

export function renderSymmetryAxis(
  ctx: CanvasRenderingContext2D,
  options: SymmetryAxisRenderOptions,
): void {
  const { config, transform, canvasWidth, canvasHeight, style } = options;
  if (!style.visible || !isSymmetryActive(config)) return;

  const displayWidth = logicalRectToScreenWidth(canvasWidth, transform);
  const displayHeight = logicalRectToScreenHeight(canvasHeight, transform);

  ctx.save();

  if (config.horizontal) {
    const x = logicalToScreenX(symmetryAxisCoord(config.originX), transform) + 0.5;
    strokeAxisLine(ctx, x, transform.offsetY, x, transform.offsetY + displayHeight, style);
  }

  if (config.vertical) {
    const y = logicalToScreenY(symmetryAxisCoord(config.originY), transform) + 0.5;
    strokeAxisLine(ctx, transform.offsetX, y, transform.offsetX + displayWidth, y, style);
  }

  ctx.restore();
}
