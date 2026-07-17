import { pixelColorToOklch } from "@/domain/color/ColorConverter";
import {
  createLuminancePaletteSwatch,
  type LuminancePaletteSwatch,
} from "./LuminancePaletteSwatch";
import type { ColorEntry } from "@/domain/palette/Palette";

function compareByOklchLightnessDesc(a: PixelColorComparable, b: PixelColorComparable): number {
  const lightnessDelta = b.lightness - a.lightness;
  if (lightnessDelta !== 0) return lightnessDelta;
  return a.order - b.order;
}

interface PixelColorComparable {
  lightness: number;
  order: number;
}

export function sortColorEntriesByOklchLightnessDesc(
  entries: readonly ColorEntry[],
): ColorEntry[] {
  const indexed = entries.map((entry, order) => ({
    entry,
    lightness: pixelColorToOklch(entry.color).l,
    order,
  }));
  indexed.sort((a, b) => compareByOklchLightnessDesc(a, b));
  return indexed.map((item) => item.entry);
}

export function sortSwatchesByOklchLightnessDesc(
  swatches: readonly LuminancePaletteSwatch[],
): LuminancePaletteSwatch[] {
  const indexed = swatches.map((swatch, order) => ({
    swatch,
    lightness: pixelColorToOklch(swatch.color).l,
    order,
  }));
  indexed.sort((a, b) => compareByOklchLightnessDesc(a, b));
  return indexed.map((item) => ({
    color: item.swatch.color,
    hex: item.swatch.hex,
  }));
}

export function sortAndLimitColorEntriesByOklchLightness(
  entries: readonly ColorEntry[],
  limit: number,
): LuminancePaletteSwatch[] {
  return sortColorEntriesByOklchLightnessDesc(entries)
    .slice(0, limit)
    .map((entry) => createLuminancePaletteSwatch(entry.color));
}
