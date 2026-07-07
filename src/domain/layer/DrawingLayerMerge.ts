import type { Point } from "../tool/ITool";
import type { DrawingLayer, Layer } from "./Layer";
import { expandDrawingLayerToIncludeCanvasPoints } from "./DrawingLayerOperations";
import { getLayerGrid, syncLayerPixels } from "./LayerOperations";
import { isDrawingLayer } from "./LayerTypeGuards";

function getUpperLayerCanvasCorners(upper: DrawingLayer): Point[] {
  return [
    { x: upper.position.x, y: upper.position.y },
    { x: upper.position.x + upper.width - 1, y: upper.position.y },
    { x: upper.position.x, y: upper.position.y + upper.height - 1 },
    {
      x: upper.position.x + upper.width - 1,
      y: upper.position.y + upper.height - 1,
    },
  ];
}

export function canMergeDrawingLayerDown(layers: Layer[], layerId: string): boolean {
  const index = layers.findIndex((layer) => layer.id === layerId);
  if (index <= 0) return false;

  const upper = layers[index];
  const lower = layers[index - 1];
  if (!upper || !lower || !isDrawingLayer(upper) || !isDrawingLayer(lower)) {
    return false;
  }
  return !upper.locked && !lower.locked;
}

export function mergeDrawingLayerDown(
  layers: Layer[],
  upperLayerId: string,
): { layers: Layer[]; activeLayerId: string } | null {
  if (!canMergeDrawingLayerDown(layers, upperLayerId)) return null;

  const index = layers.findIndex((layer) => layer.id === upperLayerId);
  const upper = layers[index] as DrawingLayer;
  let lower = layers[index - 1] as DrawingLayer;

  lower = expandDrawingLayerToIncludeCanvasPoints(
    lower,
    getUpperLayerCanvasCorners(upper),
  );

  const lowerGrid = getLayerGrid(lower);
  const upperGrid = getLayerGrid(upper);
  const offsetX = upper.position.x - lower.position.x;
  const offsetY = upper.position.y - lower.position.y;
  upperGrid.compositeOverOnto(lowerGrid, offsetX, offsetY, upper.opacity);
  lower = syncLayerPixels(lower, lowerGrid);

  const nextLayers = [...layers];
  nextLayers[index - 1] = lower;
  nextLayers.splice(index, 1);

  return { layers: nextLayers, activeLayerId: lower.id };
}
