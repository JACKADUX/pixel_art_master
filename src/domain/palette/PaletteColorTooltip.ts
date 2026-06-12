import { getAlpha, toHexAlpha, type PixelColor } from "@/domain/canvas/PixelColor";
import { pixelColorToOklabPolar } from "@/domain/color/ColorConverter";

export function formatPaletteColorTooltip(color: PixelColor, hex?: string): string {
  const polar = pixelColorToOklabPolar(color);
  const hexValue = hex ?? toHexAlpha(color);
  return `${hexValue}\nH: ${Math.round(polar.h)}°  S: ${Math.round(polar.s)}%  L: ${Math.round(polar.l * 100)}%  A: ${Math.round((getAlpha(color) / 255) * 100)}%`;
}
