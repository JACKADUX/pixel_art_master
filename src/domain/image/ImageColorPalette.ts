import { PixelGrid } from "../canvas/PixelGrid";
import {
  buildReferenceColorPalette,
  REFERENCE_LAYER_PALETTE_MAX_COLORS,
} from "../layer/ReferenceLayerPalette";
import type { ColorEntry } from "../palette/Palette";

export function buildColorPaletteFromImageData(
  imageData: ImageData,
  maxColors = REFERENCE_LAYER_PALETTE_MAX_COLORS,
): ColorEntry[] {
  const grid = PixelGrid.fromRgba(imageData.width, imageData.height, imageData.data);
  return buildReferenceColorPalette(grid.toUint32Array(), maxColors);
}
