import { PixelGrid } from "../canvas/PixelGrid";
import type { Point } from "../tool/ITool";

export type FloatingSource = "layer" | "paste" | "cut";

export interface FloatingSelection {
  pixels: PixelGrid;
  offset: Point;
  originInLayer: Point;
  source: FloatingSource;
}

export function cloneFloatingSelection(floating: FloatingSelection): FloatingSelection {
  return {
    pixels: floating.pixels.clone(),
    offset: { ...floating.offset },
    originInLayer: { ...floating.originInLayer },
    source: floating.source,
  };
}
