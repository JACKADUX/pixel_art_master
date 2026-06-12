const CHECKER_LIGHT = "#3f3f46";
const CHECKER_DARK = "#18181b";

export function renderTransparencyCheckerboard(
  ctx: CanvasRenderingContext2D,
  logicalWidth: number,
  logicalHeight: number,
  zoom: number,
): void {
  const displayWidth = logicalWidth * zoom;
  const displayHeight = logicalHeight * zoom;

  const pattern = document.createElement("canvas");
  pattern.width = logicalWidth;
  pattern.height = logicalHeight;
  const patternCtx = pattern.getContext("2d");
  if (!patternCtx) return;

  for (let y = 0; y < logicalHeight; y++) {
    for (let x = 0; x < logicalWidth; x++) {
      patternCtx.fillStyle = (x + y) % 2 === 0 ? CHECKER_LIGHT : CHECKER_DARK;
      patternCtx.fillRect(x, y, 1, 1);
    }
  }

  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(pattern, 0, 0, displayWidth, displayHeight);
}
