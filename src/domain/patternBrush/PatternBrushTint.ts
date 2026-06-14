import { getAlpha, rgba, toRgbComponents, TRANSPARENT, type PixelColor } from "@/domain/canvas/PixelColor";

export function tintWithForeground(patternPixel: PixelColor, foreground: PixelColor): PixelColor {
  const alpha = getAlpha(patternPixel);
  if (alpha === 0) return TRANSPARENT;
  const { r, g, b } = toRgbComponents(foreground);
  return rgba(r, g, b, alpha);
}

export function tintWithBackground(patternPixel: PixelColor, background: PixelColor): PixelColor {
  const alpha = getAlpha(patternPixel);
  if (alpha === 0) return TRANSPARENT;
  if (getAlpha(background) === 0) return TRANSPARENT;
  const { r, g, b } = toRgbComponents(background);
  return rgba(r, g, b, alpha);
}

export type PatternDrawMode = "foreground" | "background";

export function tintPatternPixel(
  patternPixel: PixelColor,
  drawMode: PatternDrawMode,
  foreground: PixelColor,
  background: PixelColor,
  applyForegroundTint = true,
): PixelColor {
  if (drawMode === "foreground") {
    if (!applyForegroundTint) return patternPixel;
    return tintWithForeground(patternPixel, foreground);
  }
  return tintWithBackground(patternPixel, background);
}
