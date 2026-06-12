import type { CanvasSize } from "../canvas/CanvasSize";
import { PixelGrid } from "../canvas/PixelGrid";
import type { Layer } from "./Layer";
import { getLayerGrid } from "./LayerOperations";

export function compositeLayers(
  layers: Layer[],
  size: CanvasSize,
): PixelGrid {
  let result = PixelGrid.createEmpty(size.width, size.height);

  for (const layer of layers) {
    if (!layer.visible) continue;
    const grid = getLayerGrid(layer, size);
    result = grid.compositeOver(result);
  }

  return result;
}
