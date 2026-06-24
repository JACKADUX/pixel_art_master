import { describe, expect, it } from "vitest";
import { rgba } from "@/domain/canvas/PixelColor";
import {
  hslToPixelColor,
  oklchToPixelColor,
  pixelColorToHslPreservingHue,
  pixelColorToOklchPreservingHue,
} from "./ColorConverter";
import { createHsl } from "./HslColor";
import { createOklch } from "./OklchColor";

describe("pixelColorToHslPreservingHue", () => {
  it("keeps previous hue when saturation is zero", () => {
    const gray = hslToPixelColor(createHsl(180, 0, 50));
    const result = pixelColorToHslPreservingHue(gray, createHsl(180, 50, 50));
    expect(result.h).toBeCloseTo(180, 5);
    expect(result.s).toBe(0);
  });

  it("keeps previous hue when lightness is zero", () => {
    const black = hslToPixelColor(createHsl(120, 80, 0));
    const result = pixelColorToHslPreservingHue(black, createHsl(120, 80, 50));
    expect(result.h).toBeCloseTo(120, 5);
    expect(result.s).toBe(0);
    expect(result.l).toBe(0);
  });

  it("keeps previous hue for near-gray HSL roundtrip", () => {
    const gray = hslToPixelColor(createHsl(180, 0, 50));
    const result = pixelColorToHslPreservingHue(gray, createHsl(180, 50, 50));
    expect(result.h).toBeCloseTo(180, 5);
    expect(result.s).toBe(0);
  });

  it("uses derived hue for chromatic colors", () => {
    const red = rgba(255, 0, 0);
    const result = pixelColorToHslPreservingHue(red, createHsl(180, 50, 50));
    expect(result.h).toBeCloseTo(0, 5);
    expect(result.s).toBeCloseTo(100, 5);
  });
});

describe("pixelColorToOklchPreservingHue", () => {
  it("keeps previous hue when chroma is zero", () => {
    const gray = oklchToPixelColor(createOklch(0.5, 0, 200));
    const result = pixelColorToOklchPreservingHue(gray, createOklch(0.5, 0.2, 200));
    expect(result.h).toBeCloseTo(200, 5);
    expect(result.c).toBeCloseTo(0, 3);
    expect(result.l).toBeCloseTo(0.5, 3);
  });

  it("keeps previous hue for achromatic black", () => {
    const black = rgba(0, 0, 0);
    const result = pixelColorToOklchPreservingHue(black, createOklch(0.5, 0.2, 90));
    expect(result.h).toBeCloseTo(90, 5);
    expect(result.c).toBeCloseTo(0, 3);
    expect(result.l).toBe(0);
  });

  it("uses derived hue for chromatic colors", () => {
    const red = rgba(255, 0, 0);
    const result = pixelColorToOklchPreservingHue(red, createOklch(0.5, 0.2, 200));
    expect(result.c).toBeGreaterThan(0);
    expect(result.h).not.toBeCloseTo(200, 0);
  });
});
