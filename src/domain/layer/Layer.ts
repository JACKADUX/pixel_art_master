import type { CanvasSize } from "../canvas/CanvasSize";
import { PixelGrid } from "../canvas/PixelGrid";

export type LayerType = "reference" | "drawing";

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayerPosition {
  x: number;
  y: number;
}

export interface ImageSize {
  width: number;
  height: number;
}

export interface ReferenceGridConfig {
  primary: number;
  secondary: number;
  visible: boolean;
}

export interface DrawingLayer {
  id: string;
  name: string;
  type: "drawing";
  visible: boolean;
  pixels: Uint32Array;
}

export interface ReferenceLayer {
  id: string;
  name: string;
  type: "reference";
  visible: boolean;
  imageData: string | null;
  imageSize: ImageSize | null;
  crop: CropRect | null;
  position: LayerPosition;
  grid: ReferenceGridConfig;
  /** Uniform display scale applied on top of the crop size (1 = original size). */
  scale: number;
  /** Whether the extracted color strip is shown beneath the reference image. */
  paletteVisible: boolean;
}

export type Layer = DrawingLayer | ReferenceLayer;

/** 深拷贝单个图层，保证可变的像素缓冲与嵌套对象与原图层互不影响。 */
export function cloneLayer(layer: Layer): Layer {
  if (layer.type === "drawing") {
    return { ...layer, pixels: new Uint32Array(layer.pixels) };
  }
  return {
    ...layer,
    crop: layer.crop ? { ...layer.crop } : null,
    position: { ...layer.position },
    grid: { ...layer.grid },
  };
}

/** 深拷贝图层列表。 */
export function cloneLayers(layers: Layer[]): Layer[] {
  return layers.map(cloneLayer);
}

export function createDrawingLayer(
  grid: PixelGrid,
  name?: string,
): DrawingLayer {
  return {
    id: crypto.randomUUID(),
    name: name ?? "绘制层",
    type: "drawing",
    visible: true,
    pixels: grid.toUint32Array(),
  };
}

export function createEmptyDrawingLayer(
  size: CanvasSize,
  name?: string,
): DrawingLayer {
  const pixelCount = size.width * size.height;
  return {
    id: crypto.randomUUID(),
    name: name ?? "绘制层",
    type: "drawing",
    visible: true,
    pixels: new Uint32Array(pixelCount),
  };
}

export function createEmptyReferenceLayer(name?: string): ReferenceLayer {
  return {
    id: crypto.randomUUID(),
    name: name ?? "参考层",
    type: "reference",
    visible: true,
    imageData: null,
    imageSize: null,
    crop: null,
    position: { x: 0, y: 0 },
    grid: {
      primary: 16,
      secondary: 8,
      visible: false,
    },
    scale: 1,
    paletteVisible: true,
  };
}

/** @deprecated Use createDrawingLayer or createEmptyDrawingLayer */
export function createLayer(
  type: LayerType,
  grid: PixelGrid,
  name?: string,
): Layer {
  if (type === "reference") {
    throw new Error("Use ReferenceLayerOperations.setReferenceImage for reference layers");
  }
  return createDrawingLayer(grid, name);
}

/** @deprecated Use createEmptyDrawingLayer or createEmptyReferenceLayer */
export function createEmptyLayer(
  type: LayerType,
  size: CanvasSize,
  name?: string,
): Layer {
  if (type === "reference") {
    return createEmptyReferenceLayer(name);
  }
  return createEmptyDrawingLayer(size, name);
}
