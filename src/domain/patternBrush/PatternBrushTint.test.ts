import { describe, expect, it } from "vitest";
import { rgba, TRANSPARENT, getAlpha } from "@/domain/canvas/PixelColor";
import {
  tintWithBackground,
  tintWithForeground,
  tintPatternPixel,
} from "./PatternBrushTint";

describe("PatternBrushTint", () => {
  it("tints foreground while preserving pattern alpha", () => {
    const pattern = rgba(100, 150, 200, 128);
    const fg = rgba(255, 0, 0, 255);
    const result = tintWithForeground(pattern, fg);
    expect(result & 0xffffff).toBe(rgba(255, 0, 0, 255) & 0xffffff);
    expect(getAlpha(result)).toBe(128);
  });

  it("returns transparent for transparent pattern pixels", () => {
    expect(tintWithForeground(TRANSPARENT, rgba(255, 0, 0))).toBe(TRANSPARENT);
  });

  it("fills with background color using pattern alpha", () => {
    const pattern = rgba(0, 0, 0, 200);
    const bg = rgba(0, 255, 0, 255);
    const result = tintWithBackground(pattern, bg);
    expect(result & 0xffffff).toBe(rgba(0, 255, 0, 255) & 0xffffff);
    expect(getAlpha(result)).toBe(200);
  });

  it("erases when background is transparent", () => {
    const pattern = rgba(0, 0, 0, 200);
    expect(tintWithBackground(pattern, TRANSPARENT)).toBe(TRANSPARENT);
  });

  it("returns original pixel when foreground tint disabled", () => {
    const pattern = rgba(10, 20, 30, 200);
    const fg = rgba(255, 0, 0, 255);
    expect(tintPatternPixel(pattern, "foreground", fg, TRANSPARENT, false)).toBe(pattern);
  });
});
