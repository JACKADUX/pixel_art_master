export interface CheckerboardOptions {
  tileSize: number;
  lightColor: string;
  darkColor: string;
}

export function renderTransparencyCheckerboard(
  ctx: CanvasRenderingContext2D,
  logicalWidth: number,
  logicalHeight: number,
  zoom: number,
  options: CheckerboardOptions,
): void {
  const { tileSize, lightColor, darkColor } = options;
  const displayWidth = logicalWidth * zoom;
  const displayHeight = logicalHeight * zoom;

  const tileCanvas = document.createElement("canvas");
  tileCanvas.width = tileSize * 2;
  tileCanvas.height = tileSize * 2;
  const tileCtx = tileCanvas.getContext("2d");
  if (!tileCtx) return;

  tileCtx.fillStyle = lightColor;
  tileCtx.fillRect(0, 0, tileCanvas.width, tileCanvas.height);
  tileCtx.fillStyle = darkColor;
  tileCtx.fillRect(0, 0, tileSize, tileSize);
  tileCtx.fillRect(tileSize, tileSize, tileSize, tileSize);

  const logicalCanvas = document.createElement("canvas");
  logicalCanvas.width = logicalWidth;
  logicalCanvas.height = logicalHeight;
  const logicalCtx = logicalCanvas.getContext("2d");
  if (!logicalCtx) return;

  const pattern = logicalCtx.createPattern(tileCanvas, "repeat");
  if (!pattern) return;

  logicalCtx.fillStyle = pattern;
  logicalCtx.fillRect(0, 0, logicalWidth, logicalHeight);

  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(logicalCanvas, 0, 0, displayWidth, displayHeight);
}
