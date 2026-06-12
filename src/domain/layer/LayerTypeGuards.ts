import type { DrawingLayer, Layer, ReferenceLayer } from "./Layer";

export function isDrawingLayer(layer: Layer): layer is DrawingLayer {
  return layer.type === "drawing";
}

export function isReferenceLayer(layer: Layer): layer is ReferenceLayer {
  return layer.type === "reference";
}
