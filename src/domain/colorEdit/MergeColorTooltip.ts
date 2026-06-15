import { toHexAlpha, type PixelColor } from "../canvas/PixelColor";
import { pixelColorToHsl, pixelColorToOklab } from "../color/ColorConverter";

export function formatMergeColorSwatchTooltip(color: PixelColor, hex?: string): string {
  const hsl = pixelColorToHsl(color);
  const oklab = pixelColorToOklab(color);
  const hexValue = hex ?? toHexAlpha(color);
  return `${hexValue}\nH: ${Math.round(hsl.h)}°  S: ${Math.round(hsl.s)}%  Oklab L: ${(oklab.l * 100).toFixed(1)}%`;
}
