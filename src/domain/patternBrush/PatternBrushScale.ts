import { PixelGrid } from "@/domain/canvas/PixelGrid";
import {
  clampPatternScale,
  DEFAULT_PATTERN_SCALE,
} from "@/domain/tool/ToolType";

export function scalePixelGridNearest(
  grid: PixelGrid,
  scalePercent: number,
): PixelGrid | null {
  const scale = clampPatternScale(scalePercent);
  if (scale === 0) return null;

  if (scale === DEFAULT_PATTERN_SCALE) {
    return grid;
  }

  const scaledWidth = Math.max(1, Math.round((grid.width * scale) / 100));
  const scaledHeight = Math.max(1, Math.round((grid.height * scale) / 100));

  if (scaledWidth === grid.width && scaledHeight === grid.height) {
    return grid;
  }

  const result = PixelGrid.createEmpty(scaledWidth, scaledHeight);
  for (let y = 0; y < scaledHeight; y++) {
    for (let x = 0; x < scaledWidth; x++) {
      const srcX = Math.floor((x * grid.width) / scaledWidth);
      const srcY = Math.floor((y * grid.height) / scaledHeight);
      result.setPixel(x, y, grid.getPixel(srcX, srcY));
    }
  }
  return result;
}
