import { symmetryAxisColorRgba } from "@/domain/appSettings/AppSettings";
import type { SymmetryConfig } from "@/domain/symmetry/SymmetryConfig";
import { isSymmetryActive } from "@/domain/symmetry/SymmetryConfig";
import { symmetryAxisDisplayCoord } from "@/domain/symmetry/SymmetryMirror";

export interface SymmetryAxisStyle {
  visible: boolean;
  colorHex: string;
  lineWidth: number;
  outlineEnabled: boolean;
}

export interface SymmetryAxisRenderOptions {
  config: SymmetryConfig;
  zoom: number;
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
  const { config, zoom, canvasWidth, canvasHeight, style } = options;
  if (!style.visible || !isSymmetryActive(config)) return;

  const displayWidth = canvasWidth * zoom;
  const displayHeight = canvasHeight * zoom;

  ctx.save();

  if (config.horizontal) {
    const x = symmetryAxisDisplayCoord(config.originX, zoom) + 0.5;
    strokeAxisLine(ctx, x, 0, x, displayHeight, style);
  }

  if (config.vertical) {
    const y = symmetryAxisDisplayCoord(config.originY, zoom) + 0.5;
    strokeAxisLine(ctx, 0, y, displayWidth, y, style);
  }

  ctx.restore();
}
