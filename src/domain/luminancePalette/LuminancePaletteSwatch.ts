import type { PixelColor } from "@/domain/canvas/PixelColor";
import { fromHex, toHexAlpha } from "@/domain/canvas/PixelColor";

export interface LuminancePaletteSwatch {
  color: PixelColor;
  hex: string;
}

export function createLuminancePaletteSwatch(color: PixelColor): LuminancePaletteSwatch {
  const hex = toHexAlpha(color);
  return { color, hex };
}

export function luminancePaletteSwatchFromHex(hex: string): LuminancePaletteSwatch {
  const color = fromHex(hex);
  return { color, hex };
}
