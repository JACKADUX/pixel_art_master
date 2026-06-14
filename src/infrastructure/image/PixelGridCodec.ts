import type { PixelGrid } from "@/domain/canvas/PixelGrid";

export function pixelGridToImageData(grid: PixelGrid): ImageData {
  return new ImageData(grid.toRgba(), grid.width, grid.height);
}
