import { describe, expect, it } from "vitest";
import { analyzeColorVariation, parseColorListInput } from "./ColorVariationAnalysis";
import { sortColorVariationPointsForChart } from "./ColorVariationChartSort";

describe("sortColorVariationPointsForChart", () => {
  it("keeps list order in list mode", () => {
    const entries = parseColorListInput("#000000\n#ffffff\n#808080");
    const points = analyzeColorVariation(entries).points;
    const sorted = sortColorVariationPointsForChart(points, "list");
    expect(sorted.map((point) => point.index)).toEqual([0, 1, 2]);
  });

  it("sorts by OKLCH lightness ascending", () => {
    const entries = parseColorListInput("#ffffff\n#000000\n#808080");
    const points = analyzeColorVariation(entries).points;
    const sorted = sortColorVariationPointsForChart(points, "lightness");
    expect(sorted[0]?.hex.startsWith("#000000")).toBe(true);
    expect(sorted[sorted.length - 1]?.hex.startsWith("#ffffff")).toBe(true);
  });

  it("uses original list index as tie-breaker", () => {
    const entries = parseColorListInput("#ff0000\n#ff0000");
    const points = analyzeColorVariation(entries).points;
    const sorted = sortColorVariationPointsForChart(points, "chroma");
    expect(sorted.map((point) => point.index)).toEqual([0, 1]);
  });
});
