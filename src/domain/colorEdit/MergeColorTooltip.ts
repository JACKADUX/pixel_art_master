import { toHexAlpha, type PixelColor } from "../canvas/PixelColor";
import { pixelColorToHsl, pixelColorToOklch } from "../color/ColorConverter";

export function formatMergeColorSwatchTooltip(color: PixelColor, hex?: string): string {
  const hsl = pixelColorToHsl(color);
  const oklch = pixelColorToOklch(color);
  const hexValue = hex ?? toHexAlpha(color);
  return `${hexValue}\nH: ${Math.round(hsl.h)}°  S: ${Math.round(hsl.s)}%  OKLCH L: ${(oklch.l * 100).toFixed(1)}%`;
}
