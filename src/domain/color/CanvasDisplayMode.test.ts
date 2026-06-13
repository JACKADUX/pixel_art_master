import { describe, expect, it } from "vitest";
import { rgbToOklab } from "./ColorConverter";
import { oklabLightnessFromRgb } from "./CanvasDisplayMode";

describe("oklabLightnessFromRgb", () => {
  it("matches rgbToOklab L for black and white", () => {
    expect(oklabLightnessFromRgb(0, 0, 0)).toBeCloseTo(0, 5);
    expect(oklabLightnessFromRgb(255, 255, 255)).toBeCloseTo(1, 5);
  });

  it("matches rgbToOklab L for arbitrary colors", () => {
    const samples: [number, number, number][] = [
      [255, 0, 0],
      [0, 255, 0],
      [0, 0, 255],
      [128, 64, 200],
      [50, 180, 90],
    ];
    for (const [r, g, b] of samples) {
      expect(oklabLightnessFromRgb(r, g, b)).toBeCloseTo(rgbToOklab(r, g, b).l, 10);
    }
  });

  it("assigns similar L to same-hue colors with different saturation", () => {
    const red = oklabLightnessFromRgb(255, 0, 0);
    const pink = oklabLightnessFromRgb(255, 128, 128);
    expect(Math.abs(red - pink)).toBeLessThan(0.15);
  });
});
