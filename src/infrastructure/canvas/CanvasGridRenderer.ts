export interface CanvasGridRenderOptions {
  primary: number;
  secondary: number;
  colorRgb: string;
  lineWidth: number;
  subGridEnabled: boolean;
}

export function renderCanvasGrid(
  ctx: CanvasRenderingContext2D,
  gridWidth: number,
  gridHeight: number,
  zoom: number,
  options: CanvasGridRenderOptions,
): void {
  const { primary, secondary, colorRgb, lineWidth, subGridEnabled } = options;
  const displayWidth = gridWidth * zoom;
  const displayHeight = gridHeight * zoom;

  ctx.lineWidth = lineWidth;

  if (subGridEnabled && secondary < primary) {
    ctx.strokeStyle = `rgba(${colorRgb}, 0.5)`;
    for (let x = 0; x <= gridWidth; x += secondary) {
      if (x % primary !== 0) {
        ctx.beginPath();
        ctx.moveTo(x * zoom + 0.5, 0);
        ctx.lineTo(x * zoom + 0.5, displayHeight);
        ctx.stroke();
      }
    }
    for (let y = 0; y <= gridHeight; y += secondary) {
      if (y % primary !== 0) {
        ctx.beginPath();
        ctx.moveTo(0, y * zoom + 0.5);
        ctx.lineTo(displayWidth, y * zoom + 0.5);
        ctx.stroke();
      }
    }
  }

  ctx.strokeStyle = `rgba(${colorRgb}, 1)`;
  for (let x = 0; x <= gridWidth; x += primary) {
    ctx.beginPath();
    ctx.moveTo(x * zoom + 0.5, 0);
    ctx.lineTo(x * zoom + 0.5, displayHeight);
    ctx.stroke();
  }
  for (let y = 0; y <= gridHeight; y += primary) {
    ctx.beginPath();
    ctx.moveTo(0, y * zoom + 0.5);
    ctx.lineTo(displayWidth, y * zoom + 0.5);
    ctx.stroke();
  }
}
