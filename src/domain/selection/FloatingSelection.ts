import { PixelGrid } from "../canvas/PixelGrid";
import type { Point } from "../tool/ITool";

export interface FloatingSelection {
  pixels: PixelGrid;
  offset: Point;
  originInLayer: Point;
}

export function cloneFloatingSelection(floating: FloatingSelection): FloatingSelection {
  return {
    pixels: floating.pixels.clone(),
    offset: { ...floating.offset },
    originInLayer: { ...floating.originInLayer },
  };
}
