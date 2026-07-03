import { rgba, toHexAlpha } from "../canvas/PixelColor";
import type { ColorEntry } from "./Palette";

export const DEFAULT_IMAGE_PALETTE_PIXEL_LIMIT = 256;

/**
 * 取图片按行优先顺序的前 maxPixels 个像素，按首次出现顺序去重后生成色板条目。
 */
export function buildPaletteFromLeadingPixels(
  imageData: ImageData,
  maxPixels = DEFAULT_IMAGE_PALETTE_PIXEL_LIMIT,
): ColorEntry[] {
  const { data } = imageData;
  const pixelCount = Math.min(maxPixels, Math.floor(data.length / 4));
  const entries: ColorEntry[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < pixelCount; i++) {
    const offset = i * 4;
    const color = rgba(data[offset], data[offset + 1], data[offset + 2], data[offset + 3]);
    const hex = toHexAlpha(color);
    if (seen.has(hex)) continue;
    seen.add(hex);
    entries.push({ color, hex });
  }

  return entries;
}
