import type { CanvasSize } from "../canvas/CanvasSize";
import { PixelGrid } from "../canvas/PixelGrid";

export type LayerType = "reference" | "drawing";

export interface Layer {
  id: string;
  name: string;
  type: LayerType;
  visible: boolean;
  pixels: Uint32Array;
}

export function createLayer(
  type: LayerType,
  grid: PixelGrid,
  name?: string,
): Layer {
  return {
    id: crypto.randomUUID(),
    name: name ?? (type === "reference" ? "参考层" : "绘制层"),
    type,
    visible: true,
    pixels: grid.toUint32Array(),
  };
}

export function createEmptyLayer(
  type: LayerType,
  size: CanvasSize,
  name?: string,
): Layer {
  const pixelCount = size.width * size.height;
  return {
    id: crypto.randomUUID(),
    name: name ?? (type === "reference" ? "参考层" : "绘制层"),
    type,
    visible: true,
    pixels: new Uint32Array(pixelCount),
  };
}
