import { describe, expect, it } from "vitest";
import { computeColorVariationChartLayout } from "./ColorVariationChartLayout";

describe("computeColorVariationChartLayout", () => {
  it("maps 0% to plot bottom and 100% to plot top", () => {
    const layout = computeColorVariationChartLayout(400, 400);
    expect(layout.valueToY(0)).toBeCloseTo(layout.plotBottom, 5);
    expect(layout.valueToY(100)).toBeCloseTo(layout.plotTop, 5);
  });

  it("maps 50% to plot vertical center", () => {
    const layout = computeColorVariationChartLayout(400, 400);
    const midY = layout.plotTop + layout.plotHeight / 2;
    expect(layout.valueToY(50)).toBeCloseTo(midY, 5);
  });

  it("aligns rounded display values with node positions", () => {
    const layout = computeColorVariationChartLayout(400, 400);
    expect(layout.valueToY(74.6)).toBe(layout.valueToY(75));
  });

  it("uses a consistent chart height when measured height is smaller than minimum", () => {
    const layout = computeColorVariationChartLayout(300, 120);
    expect(layout.chartHeight).toBe(200);
    expect(layout.valueToY(0)).toBeCloseTo(layout.plotBottom, 5);
  });
});
