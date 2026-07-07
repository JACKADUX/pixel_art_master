import { cloneLayer, type DrawingLayer } from "./Layer";
import { isDrawingLayer } from "./LayerTypeGuards";

export interface DrawingLayerClipboard {
  layer: DrawingLayer;
  sourceCanvasId: string;
}

export function createDrawingLayerClipboard(
  layer: DrawingLayer,
  sourceCanvasId: string,
): DrawingLayerClipboard {
  const cloned = cloneLayer(layer);
  if (!isDrawingLayer(cloned)) {
    throw new Error("Expected a drawing layer for clipboard");
  }
  return { layer: cloned, sourceCanvasId };
}

export function toPastedLayer(clipboard: DrawingLayerClipboard): DrawingLayer {
  const { layer } = clipboard;
  return {
    ...layer,
    id: crypto.randomUUID(),
    name: `${layer.name} 副本`,
    locked: false,
    position: { ...layer.position },
    pixels: new Uint32Array(layer.pixels),
  };
}
