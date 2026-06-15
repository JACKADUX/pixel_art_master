import type { PixelColor } from "../canvas/PixelColor";
import { buildReferenceColorPalette } from "../layer/ReferenceLayerPalette";
import type { ColorEntry } from "../palette/Palette";

export interface DiffusionRegionGroup {
  colors: ColorEntry[];
  uniqueColorCount: number;
  pixelCount: number;
}

export interface DiffusionRegionGroups {
  groupCount: number;
  groups: DiffusionRegionGroup[];
}

export function buildDiffusionRegionGroup(pixels: readonly PixelColor[]): DiffusionRegionGroup {
  const packed = new Uint32Array(pixels.length);
  for (let i = 0; i < pixels.length; i += 1) {
    packed[i] = pixels[i];
  }
  const colors = buildReferenceColorPalette(packed);
  return {
    colors,
    uniqueColorCount: colors.length,
    pixelCount: pixels.length,
  };
}

export function buildDiffusionRegionGroups(
  regionPixelLists: readonly PixelColor[][],
): DiffusionRegionGroups {
  const groups = regionPixelLists.map((pixels) => buildDiffusionRegionGroup(pixels));
  return {
    groupCount: groups.length,
    groups,
  };
}
