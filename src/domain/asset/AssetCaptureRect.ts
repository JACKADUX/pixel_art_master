import type { PixelGrid } from "../canvas/PixelGrid";
import { PixelGrid as PG } from "../canvas/PixelGrid";
import type { SelectionRect } from "../selection/SelectionRect";
import { normalizeRect } from "../selection/SelectionRect";

export function extractRectFromGrid(grid: PixelGrid, rect: SelectionRect): PixelGrid | null {
  if (rect.width <= 0 || rect.height <= 0) return null;

  const x0 = Math.max(0, rect.x);
  const y0 = Math.max(0, rect.y);
  const x1 = Math.min(grid.width, rect.x + rect.width);
  const y1 = Math.min(grid.height, rect.y + rect.height);
  const width = x1 - x0;
  const height = y1 - y0;
  if (width <= 0 || height <= 0) return null;

  const result = PG.createEmpty(width, height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      result.setPixel(x, y, grid.getPixel(x0 + x, y0 + y));
    }
  }
  return result;
}

export function normalizeCaptureRect(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
): SelectionRect {
  return normalizeRect(fromX, fromY, toX, toY);
}
