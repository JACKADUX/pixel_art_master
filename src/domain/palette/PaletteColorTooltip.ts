import { getAlpha, toHexAlpha, type PixelColor } from "@/domain/canvas/PixelColor";
import { pixelColorToHsl, pixelColorToOklch } from "@/domain/color/ColorConverter";
import { OKLCH_MAX_CHROMA } from "@/domain/color/OklchColor";

export function formatPaletteColorTooltip(color: PixelColor, hex?: string): string {
  const hsl = pixelColorToHsl(color);
  const oklch = pixelColorToOklch(color);
  const hexValue = hex ?? toHexAlpha(color);
  const hslLine = `H: ${Math.round(hsl.h)}°  S: ${Math.round(hsl.s)}%  L: ${Math.round(hsl.l)}%  A: ${Math.round((getAlpha(color) / 255) * 100)}%`;
  const lchLine = `LCH  L: ${Math.round(oklch.l * 100)}%  C: ${Math.round((oklch.c / OKLCH_MAX_CHROMA) * 100)}%  H: ${Math.round(oklch.h)}°`;
  return `${hexValue}\n${hslLine}\n${lchLine}`;
}
