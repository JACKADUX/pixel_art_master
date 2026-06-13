const CHECKER_LIGHT = "#c0c0c0";
const CHECKER_DARK = "#808080";
const CHECKER_SIZE = 16;

export function renderTransparencyCheckerboard(
  ctx: CanvasRenderingContext2D,
  logicalWidth: number,
  logicalHeight: number,
  zoom: number,
): void {
  const displayWidth = logicalWidth * zoom;
  const displayHeight = logicalHeight * zoom;

  const tileCanvas = document.createElement("canvas");
  tileCanvas.width = CHECKER_SIZE * 2;
  tileCanvas.height = CHECKER_SIZE * 2;
  const tileCtx = tileCanvas.getContext("2d");
  if (!tileCtx) return;

  tileCtx.fillStyle = CHECKER_LIGHT;
  tileCtx.fillRect(0, 0, tileCanvas.width, tileCanvas.height);
  tileCtx.fillStyle = CHECKER_DARK;
  tileCtx.fillRect(0, 0, CHECKER_SIZE, CHECKER_SIZE);
  tileCtx.fillRect(CHECKER_SIZE, CHECKER_SIZE, CHECKER_SIZE, CHECKER_SIZE);

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
