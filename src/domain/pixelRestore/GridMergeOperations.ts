import { rgba, type PixelColor } from "@/domain/canvas/PixelColor";
import type { GridMergeAlgorithm } from "./GridMergeAlgorithm";

function medianOf(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  }
  return sorted[mid];
}

function mergeTopLeft(colors: PixelColor[]): PixelColor {
  return colors[0] ?? 0;
}

function mergeAverage(colors: PixelColor[]): PixelColor {
  if (colors.length === 0) return 0;
  let rSum = 0;
  let gSum = 0;
  let bSum = 0;
  let aSum = 0;
  for (const color of colors) {
    rSum += color & 0xff;
    gSum += (color >> 8) & 0xff;
    bSum += (color >> 16) & 0xff;
    aSum += (color >> 24) & 0xff;
  }
  const count = colors.length;
  return rgba(
    Math.round(rSum / count),
    Math.round(gSum / count),
    Math.round(bSum / count),
    Math.round(aSum / count),
  );
}

function mergeMedian(colors: PixelColor[]): PixelColor {
  if (colors.length === 0) return 0;
  const rs: number[] = [];
  const gs: number[] = [];
  const bs: number[] = [];
  const as: number[] = [];
  for (const color of colors) {
    rs.push(color & 0xff);
    gs.push((color >> 8) & 0xff);
    bs.push((color >> 16) & 0xff);
    as.push((color >> 24) & 0xff);
  }
  return rgba(medianOf(rs), medianOf(gs), medianOf(bs), medianOf(as));
}

function mergeMode(colors: PixelColor[]): PixelColor {
  if (colors.length === 0) return 0;
  const counts = new Map<PixelColor, number>();
  let bestColor = colors[0];
  let bestCount = 0;
  for (const color of colors) {
    const next = (counts.get(color) ?? 0) + 1;
    counts.set(color, next);
    if (next > bestCount) {
      bestCount = next;
      bestColor = color;
    }
  }
  return bestColor;
}

export function mergeCellColors(
  colors: PixelColor[],
  algorithm: GridMergeAlgorithm,
): PixelColor {
  if (colors.length === 0) return 0;
  switch (algorithm) {
    case "topLeft":
      return mergeTopLeft(colors);
    case "average":
      return mergeAverage(colors);
    case "median":
      return mergeMedian(colors);
    case "mode":
      return mergeMode(colors);
  }
}
