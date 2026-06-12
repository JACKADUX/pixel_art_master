import type { PixelGrid } from "@/domain/canvas/PixelGrid";
import type { Palette } from "@/domain/palette/Palette";
import type { IImageProcessor } from "../ports/IImageProcessor";

export function extractPalette(
  processor: IImageProcessor,
  ...grids: PixelGrid[]
): Palette {
  return processor.extractPalette(...grids);
}
