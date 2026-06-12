const GRID_BLUE = "59, 130, 246";
const GRID_PRIMARY_ALPHA = 1;
const GRID_SECONDARY_ALPHA = 0.5;

export function renderCanvasGrid(
  ctx: CanvasRenderingContext2D,
  gridWidth: number,
  gridHeight: number,
  zoom: number,
  primary: number,
  secondary: number,
): void {
  const displayWidth = gridWidth * zoom;
  const displayHeight = gridHeight * zoom;

  ctx.lineWidth = 1;

  ctx.strokeStyle = `rgba(${GRID_BLUE}, ${GRID_SECONDARY_ALPHA})`;
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

  ctx.strokeStyle = `rgba(${GRID_BLUE}, ${GRID_PRIMARY_ALPHA})`;
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
