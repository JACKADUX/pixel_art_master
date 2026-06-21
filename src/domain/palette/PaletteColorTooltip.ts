import { getAlpha, toHexAlpha, type PixelColor } from "@/domain/canvas/PixelColor";
import { pixelColorToHsl } from "@/domain/color/ColorConverter";

export function formatPaletteColorTooltip(color: PixelColor, hex?: string): string {
  const hsl = pixelColorToHsl(color);
  const hexValue = hex ?? toHexAlpha(color);
  return `${hexValue}\nH: ${Math.round(hsl.h)}°  S: ${Math.round(hsl.s)}%  L: ${Math.round(hsl.l)}%  A: ${Math.round((getAlpha(color) / 255) * 100)}%`;
}
