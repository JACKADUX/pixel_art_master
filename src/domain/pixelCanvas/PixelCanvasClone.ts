import type { PixelCanvas } from "./PixelCanvas";
import { isDrawingLayer } from "../layer/LayerTypeGuards";

export function clonePixelCanvas(canvas: PixelCanvas): PixelCanvas {
  return {
    ...canvas,
    boardPosition: { ...canvas.boardPosition },
    layers: canvas.layers.map((layer) => {
      if (!isDrawingLayer(layer)) return layer;
      return {
        ...layer,
        position: { ...layer.position },
        pixels: new Uint32Array(layer.pixels),
      };
    }).filter(isDrawingLayer),
  };
}

export function clonePixelCanvases(canvases: PixelCanvas[]): PixelCanvas[] {
  return canvases.map(clonePixelCanvas);
}
