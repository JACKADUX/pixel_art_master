import type { PixelGrid } from "@/domain/canvas/PixelGrid";
import { getAlpha } from "@/domain/canvas/PixelColor";
import { Palette } from "@/domain/palette/Palette";

export function extractPaletteFromGrids(...grids: PixelGrid[]): Palette {
  const colors: number[] = [];

  for (const grid of grids) {
    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        const color = grid.getPixel(x, y);
        if (getAlpha(color) > 0) {
          colors.push(color);
        }
      }
    }
  }

  return Palette.fromUniqueColors(colors);
}
