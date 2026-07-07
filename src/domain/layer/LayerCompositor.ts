import type { CanvasSize } from "../canvas/CanvasSize";
import { PixelGrid } from "../canvas/PixelGrid";
import type { Layer } from "./Layer";
import { getLayerGrid } from "./LayerOperations";
import { isDrawingLayer } from "./LayerTypeGuards";

export function compositeDrawingLayers(
  layers: Layer[],
  size: CanvasSize,
): PixelGrid {
  const result = PixelGrid.createEmpty(size.width, size.height);

  for (const layer of layers) {
    if (!layer.visible || !isDrawingLayer(layer)) continue;
    const grid = getLayerGrid(layer);
    grid.compositeOverOnto(result, layer.position.x, layer.position.y, layer.opacity);
  }

  return result;
}

/** @deprecated Use compositeDrawingLayers */
export function compositeLayers(
  layers: Layer[],
  size: CanvasSize,
): PixelGrid {
  return compositeDrawingLayers(layers, size);
}

export function compositeDrawingLayersUpTo(
  layers: Layer[],
  size: CanvasSize,
  endIndexExclusive: number,
): PixelGrid {
  const result = PixelGrid.createEmpty(size.width, size.height);

  for (let i = 0; i < endIndexExclusive && i < layers.length; i++) {
    const layer = layers[i];
    if (!layer.visible || !isDrawingLayer(layer)) continue;
    const grid = getLayerGrid(layer);
    grid.compositeOverOnto(result, layer.position.x, layer.position.y, layer.opacity);
  }

  return result;
}
