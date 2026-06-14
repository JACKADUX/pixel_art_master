import { toRgbComponents, getAlpha, type PixelColor } from "../canvas/PixelColor";
import type { PixelGrid } from "../canvas/PixelGrid";
import type { Point } from "../tool/ITool";
import { createEmptyMask, setMaskPixel, type SelectionMask } from "./SelectionMask";

export interface FloodSelectOptions {
  tolerance: number;
  contiguous: boolean;
}

function colorDistance(a: PixelColor, b: PixelColor): number {
  const ca = toRgbComponents(a);
  const cb = toRgbComponents(b);
  return (
    Math.abs(ca.r - cb.r) +
    Math.abs(ca.g - cb.g) +
    Math.abs(ca.b - cb.b) +
    Math.abs(getAlpha(a) - getAlpha(b))
  );
}

export function floodSelectMask(
  grid: PixelGrid,
  seed: Point,
  options: FloodSelectOptions,
): SelectionMask {
  if (!grid.inBounds(seed.x, seed.y)) {
    return createEmptyMask(grid.width, grid.height);
  }
  return floodSelectMaskByTargetColor(grid, seed, grid.getPixel(seed.x, seed.y), options);
}

function collectContiguousSeeds(
  grid: PixelGrid,
  seed: Point,
  targetColor: PixelColor,
  tolerance: number,
): Point[] {
  if (!grid.inBounds(seed.x, seed.y)) return [];

  if (colorDistance(grid.getPixel(seed.x, seed.y), targetColor) <= tolerance) {
    return [seed];
  }

  const neighbors: Point[] = [
    { x: seed.x + 1, y: seed.y },
    { x: seed.x - 1, y: seed.y },
    { x: seed.x, y: seed.y + 1 },
    { x: seed.x, y: seed.y - 1 },
  ];

  return neighbors.filter(
    (point) =>
      grid.inBounds(point.x, point.y) &&
      colorDistance(grid.getPixel(point.x, point.y), targetColor) <= tolerance,
  );
}

export function floodSelectMaskByTargetColor(
  grid: PixelGrid,
  seed: Point,
  targetColor: PixelColor,
  options: FloodSelectOptions,
): SelectionMask {
  const mask = createEmptyMask(grid.width, grid.height);
  const { tolerance, contiguous } = options;

  if (contiguous && !grid.inBounds(seed.x, seed.y)) {
    return mask;
  }

  if (contiguous) {
    const queue = collectContiguousSeeds(grid, seed, targetColor, tolerance);
    const visited = new Set<string>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      const key = `${current.x},${current.y}`;
      if (visited.has(key)) continue;
      visited.add(key);

      if (!grid.inBounds(current.x, current.y)) continue;
      const pixel = grid.getPixel(current.x, current.y);
      if (colorDistance(pixel, targetColor) > tolerance) continue;

      setMaskPixel(mask, current.x, current.y, true);
      queue.push(
        { x: current.x + 1, y: current.y },
        { x: current.x - 1, y: current.y },
        { x: current.x, y: current.y + 1 },
        { x: current.x, y: current.y - 1 },
      );
    }
  } else {
    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        if (colorDistance(grid.getPixel(x, y), targetColor) <= tolerance) {
          setMaskPixel(mask, x, y, true);
        }
      }
    }
  }

  return mask;
}
