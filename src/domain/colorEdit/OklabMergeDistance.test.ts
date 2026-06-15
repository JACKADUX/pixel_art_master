import { describe, expect, it } from "vitest";
import { createOklab } from "../color/OklabColor";
import { pixelColorToOklab } from "../color/ColorConverter";
import { rgba } from "../canvas/PixelColor";
import {
  canMergeOklabColors,
  chromaFactor,
  darkFactor,
  effectiveOklabMergeThreshold,
  HARD_L_LIMIT,
  weightedDeltaE,
} from "./OklabMergeDistance";

describe("weightedDeltaE", () => {
  it("returns zero for identical colors", () => {
    const color = createOklab(0.5, 0.1, -0.05);
    expect(weightedDeltaE(color, color)).toBe(0);
  });

  it("increases with larger component deltas", () => {
    const base = createOklab(0.5, 0, 0);
    const small = createOklab(0.51, 0.01, 0.01);
    const large = createOklab(0.55, 0.05, 0.05);
    expect(weightedDeltaE(base, small)).toBeLessThan(weightedDeltaE(base, large));
  });
});

describe("canMergeOklabColors", () => {
  it("never merges when lightness delta exceeds hard limit", () => {
    const dark = createOklab(0.1, 0, 0);
    const light = createOklab(0.1 + HARD_L_LIMIT + 0.01, 0, 0);
    expect(canMergeOklabColors(dark, light, { threshold: 0.05 })).toBe(false);
  });

  it("merges similar low-chroma grays at generous threshold", () => {
    const grayA = pixelColorToOklab(rgba(8, 8, 8, 255));
    const grayB = pixelColorToOklab(rgba(12, 12, 12, 255));
    expect(canMergeOklabColors(grayA, grayB, { threshold: 0.05 })).toBe(true);
  });

  it("rejects high-chroma red and blue even with small deltaE at default threshold", () => {
    const red = pixelColorToOklab(rgba(220, 20, 20, 255));
    const blue = pixelColorToOklab(rgba(20, 20, 220, 255));
    expect(canMergeOklabColors(red, blue, { threshold: 0.035 })).toBe(false);
  });
});

describe("dynamic threshold factors", () => {
  it("darkFactor is lower in dark regions", () => {
    expect(darkFactor(0.05)).toBeCloseTo(0.5, 1);
    expect(darkFactor(0.25)).toBeCloseTo(1, 1);
    expect(darkFactor(0.05)).toBeLessThan(darkFactor(0.25));
  });

  it("chromaFactor is lower for high chroma", () => {
    expect(chromaFactor(0.1)).toBeCloseTo(1, 1);
    expect(chromaFactor(0.4)).toBeCloseTo(0.6, 1);
    expect(chromaFactor(0.4)).toBeLessThan(chromaFactor(0.1));
  });

  it("effective threshold is stricter in dark high-chroma pairs", () => {
    const dark = createOklab(0.08, 0.12, 0.05);
    const bright = createOklab(0.6, 0.12, 0.05);
    const base = 0.035;
    expect(effectiveOklabMergeThreshold(dark, dark, base)).toBeLessThan(
      effectiveOklabMergeThreshold(bright, bright, base),
    );
  });
});
