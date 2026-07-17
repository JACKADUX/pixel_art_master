import {
  type CanvasScreenTransform,
  logicalRectToScreenHeight,
  logicalRectToScreenWidth,
  logicalToScreenX,
  logicalToScreenY,
} from "@/domain/viewport/CanvasScreenTransform";

export interface CanvasGridRenderOptions {
  primary: number;
  secondary: number;
  primarySpanY?: number;
  secondarySpanY?: number;
  colorRgb: string;
  lineWidth: number;
  subGridEnabled: boolean;
}

export function renderCanvasGrid(
  ctx: CanvasRenderingContext2D,
  gridWidth: number,
  gridHeight: number,
  transform: CanvasScreenTransform,
  options: CanvasGridRenderOptions,
): void {
  const { primary, secondary, colorRgb, lineWidth, subGridEnabled } = options;
  const primarySpanY = options.primarySpanY ?? primary;
  const secondarySpanY = options.secondarySpanY ?? secondary;
  const displayWidth = logicalRectToScreenWidth(gridWidth, transform);
  const displayHeight = logicalRectToScreenHeight(gridHeight, transform);

  ctx.lineWidth = lineWidth;

  if (subGridEnabled && secondary < primary && secondarySpanY < primarySpanY) {
    ctx.strokeStyle = `rgba(${colorRgb}, 0.5)`;
    for (let x = 0; x <= gridWidth; x += secondary) {
      if (x % primary !== 0) {
        const screenX = logicalToScreenX(x, transform) + 0.5;
        ctx.beginPath();
        ctx.moveTo(screenX, transform.offsetY);
        ctx.lineTo(screenX, transform.offsetY + displayHeight);
        ctx.stroke();
      }
    }
    for (let primaryY = 0; primaryY < gridHeight; primaryY += primarySpanY) {
      for (let sub = secondarySpanY; sub < primarySpanY; sub += secondarySpanY) {
        const y = primaryY + sub;
        if (y > gridHeight) break;
        const screenY = logicalToScreenY(y, transform) + 0.5;
        ctx.beginPath();
        ctx.moveTo(transform.offsetX, screenY);
        ctx.lineTo(transform.offsetX + displayWidth, screenY);
        ctx.stroke();
      }
    }
  }

  ctx.strokeStyle = `rgba(${colorRgb}, 1)`;
  for (let x = 0; x <= gridWidth; x += primary) {
    const screenX = logicalToScreenX(x, transform) + 0.5;
    ctx.beginPath();
    ctx.moveTo(screenX, transform.offsetY);
    ctx.lineTo(screenX, transform.offsetY + displayHeight);
    ctx.stroke();
  }
  for (let y = 0; y <= gridHeight; y += primarySpanY) {
    const screenY = logicalToScreenY(y, transform) + 0.5;
    ctx.beginPath();
    ctx.moveTo(transform.offsetX, screenY);
    ctx.lineTo(transform.offsetX + displayWidth, screenY);
    ctx.stroke();
  }
}
