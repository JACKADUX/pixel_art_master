import { describe, expect, it } from "vitest";
import { fromHex } from "@/domain/canvas/PixelColor";
import { pixelColorToOklch } from "@/domain/color/ColorConverter";
import {
  analyzeColorVariation,
  normalizeOklchForChart,
  parseColorListInput,
  unwrapHueForChart,
} from "./ColorVariationAnalysis";

describe("parseColorListInput", () => {
  it("parses multiple hex lines in order", () => {
    const entries = parseColorListInput("#ff0000\n#00ff00\n#0000ff");
    expect(entries).toHaveLength(3);
    expect(entries[0]?.hex).toBe("#ff0000ff");
    expect(entries[1]?.hex).toBe("#00ff00ff");
    expect(entries[2]?.hex).toBe("#0000ffff");
  });

  it("preserves duplicate colors", () => {
    const entries = parseColorListInput("#ff0000\n#ff0000");
    expect(entries).toHaveLength(2);
    expect(entries[0]?.hex).toBe(entries[1]?.hex);
  });

  it("skips empty lines and comments", () => {
    const entries = parseColorListInput("#ff0000\n\n// comment\n; comment\n#00ff00");
    expect(entries).toHaveLength(2);
  });
});

describe("normalizeOklchForChart", () => {
  it("normalizes L and C to 0–100%", () => {
    const oklch = pixelColorToOklch(fromHex("808080"));
    const normalized = normalizeOklchForChart(oklch);
    expect(normalized.l).toBeGreaterThan(0);
    expect(normalized.l).toBeLessThanOrEqual(100);
    expect(normalized.c).toBeGreaterThanOrEqual(0);
    expect(normalized.c).toBeLessThanOrEqual(100);
  });
});

describe("unwrapHueForChart", () => {
  it("keeps hue continuous across 350° to 10° wrap", () => {
    const hues = [350 / 3.6, 10 / 3.6];
    const unwrapped = unwrapHueForChart(hues);
    expect(unwrapped).toHaveLength(2);
    expect(Math.abs(unwrapped[1]! - unwrapped[0]!)).toBeLessThan(20);
  });

  it("returns empty array for empty input", () => {
    expect(unwrapHueForChart([])).toEqual([]);
  });
});

describe("analyzeColorVariation", () => {
  it("returns empty series for no entries", () => {
    expect(analyzeColorVariation([])).toEqual({ points: [] });
  });

  it("assigns sequential indices", () => {
    const entries = parseColorListInput("#ff0000\n#00ff00");
    const series = analyzeColorVariation(entries);
    expect(series.points).toHaveLength(2);
    expect(series.points[0]?.index).toBe(0);
    expect(series.points[1]?.index).toBe(1);
  });

  it("includes normalized and chart hue values", () => {
    const entries = parseColorListInput("#ff0000");
    const series = analyzeColorVariation(entries);
    const point = series.points[0]!;
    expect(point.normalized.l).toBeGreaterThanOrEqual(0);
    expect(point.chartHue).toBe(point.normalized.h);
  });
});
