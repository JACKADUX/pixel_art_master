import type { PixelGrid } from "@/domain/canvas/PixelGrid";

export function renderPixelGrid1x(
  ctx: CanvasRenderingContext2D,
  grid: PixelGrid,
): void {
  ctx.imageSmoothingEnabled = false;
  const rgba = grid.toRgba();
  const imageData = new ImageData(rgba, grid.width, grid.height);
  ctx.putImageData(imageData, 0, 0);
}
