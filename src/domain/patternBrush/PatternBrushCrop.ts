import { PixelGrid } from "@/domain/canvas/PixelGrid";
import { getAlpha } from "@/domain/canvas/PixelColor";

export function cropPixelGridToOpaqueBounds(grid: PixelGrid): PixelGrid | null {
  let minX = grid.width;
  let minY = grid.height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      if (getAlpha(grid.getPixel(x, y)) === 0) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  if (maxX < 0) return null;

  const width = maxX - minX + 1;
  const height = maxY - minY + 1;

  if (minX === 0 && minY === 0 && width === grid.width && height === grid.height) {
    return grid;
  }

  const cropped = PixelGrid.createEmpty(width, height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      cropped.setPixel(x, y, grid.getPixel(minX + x, minY + y));
    }
  }
  return cropped;
}
