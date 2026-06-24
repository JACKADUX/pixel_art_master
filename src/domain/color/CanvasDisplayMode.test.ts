import { describe, expect, it } from "vitest";
import { rgbToOklab } from "./ColorConverter";
import { oklchLightnessFromRgb } from "./CanvasDisplayMode";

describe("oklchLightnessFromRgb", () => {
  it("matches OKLCH L for black and white", () => {
    expect(oklchLightnessFromRgb(0, 0, 0)).toBeCloseTo(0, 5);
    expect(oklchLightnessFromRgb(255, 255, 255)).toBeCloseTo(1, 5);
  });

  it("matches rgbToOklab L for arbitrary colors because OKLCH shares the L channel", () => {
    const samples: [number, number, number][] = [
      [255, 0, 0],
      [0, 255, 0],
      [0, 0, 255],
      [128, 64, 200],
      [50, 180, 90],
    ];
    for (const [r, g, b] of samples) {
      expect(oklchLightnessFromRgb(r, g, b)).toBeCloseTo(rgbToOklab(r, g, b).l, 10);
    }
  });

  it("assigns similar L to same-hue colors with different saturation", () => {
    const red = oklchLightnessFromRgb(255, 0, 0);
    const pink = oklchLightnessFromRgb(255, 128, 128);
    expect(Math.abs(red - pink)).toBeLessThan(0.15);
  });
});
