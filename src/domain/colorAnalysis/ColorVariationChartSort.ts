import type { ColorVariationPoint } from "./ColorVariationAnalysis";

export type ColorVariationChartSortMode = "list" | "lightness" | "chroma" | "hue";

function sortKeyForMode(
  point: ColorVariationPoint,
  mode: ColorVariationChartSortMode,
): number {
  switch (mode) {
    case "lightness":
      return point.normalized.l;
    case "chroma":
      return point.normalized.c;
    case "hue":
      return point.normalized.h;
    case "list":
    default:
      return point.index;
  }
}

/** 按 OKLCH 归一化值排序，仅用于图表展示，不改变列表顺序。 */
export function sortColorVariationPointsForChart(
  points: readonly ColorVariationPoint[],
  mode: ColorVariationChartSortMode,
): ColorVariationPoint[] {
  if (mode === "list" || points.length <= 1) {
    return [...points];
  }

  return [...points].sort((a, b) => {
    const delta = sortKeyForMode(a, mode) - sortKeyForMode(b, mode);
    if (delta !== 0) return delta;
    return a.index - b.index;
  });
}

export const COLOR_VARIATION_CHART_SORT_OPTIONS: ReadonlyArray<{
  id: ColorVariationChartSortMode;
  label: string;
}> = [
  { id: "list", label: "列表顺序" },
  { id: "lightness", label: "明度" },
  { id: "chroma", label: "饱和度" },
  { id: "hue", label: "色相" },
];
