import { PixelGrid } from "../canvas/PixelGrid";
import {
  buildReferenceColorPalette,
  extractUniqueColorsFromPixels,
  REFERENCE_LAYER_PALETTE_MAX_COLORS,
} from "../layer/ReferenceLayerPalette";
import type { ColorEntry } from "../palette/Palette";

export interface ColorPaletteStats {
  uniqueCount: number;
  colors: ColorEntry[];
}

export function computeColorPaletteStats(
  imageData: ImageData,
  maxColors = REFERENCE_LAYER_PALETTE_MAX_COLORS,
): ColorPaletteStats {
  const grid = PixelGrid.fromRgba(imageData.width, imageData.height, imageData.data);
  const pixels = grid.toUint32Array();
  const uniqueCount = extractUniqueColorsFromPixels(pixels).length;
  const colors = buildReferenceColorPalette(pixels, maxColors);
  return { uniqueCount, colors };
}
