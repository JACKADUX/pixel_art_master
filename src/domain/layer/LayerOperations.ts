import type { CanvasSize } from "../canvas/CanvasSize";
import { TRANSPARENT } from "../canvas/PixelColor";
import { PixelGrid } from "../canvas/PixelGrid";
import {
  createEmptyLayer,
  createLayer,
  type Layer,
  type LayerType,
} from "./Layer";

export function getLayerGrid(layer: Layer, size: CanvasSize): PixelGrid {
  return new PixelGrid(size, layer.pixels);
}

export function syncLayerPixels(layer: Layer, grid: PixelGrid): Layer {
  return { ...layer, pixels: grid.toUint32Array() };
}

export function addDrawingLayer(
  layers: Layer[],
  size: CanvasSize,
  name?: string,
): Layer[] {
  const newLayer = createEmptyLayer("drawing", size, name);
  return [...layers, newLayer];
}

export function addReferenceLayer(
  layers: Layer[],
  grid: PixelGrid,
  name?: string,
): Layer[] {
  const newLayer = createLayer("reference", grid, name);
  return [newLayer, ...layers];
}

export function removeLayer(layers: Layer[], layerId: string): Layer[] {
  const drawingCount = layers.filter((l) => l.type === "drawing").length;
  const target = layers.find((l) => l.id === layerId);
  if (!target) return layers;
  if (target.type === "drawing" && drawingCount <= 1) return layers;
  return layers.filter((l) => l.id !== layerId);
}

export function canRemoveLayer(layers: Layer[], layerId: string): boolean {
  const target = layers.find((l) => l.id === layerId);
  if (!target) return false;
  if (target.type === "drawing") {
    return layers.filter((l) => l.type === "drawing").length > 1;
  }
  return true;
}

export function reorderLayer(
  layers: Layer[],
  fromIndex: number,
  toIndex: number,
): Layer[] {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= layers.length ||
    toIndex >= layers.length ||
    fromIndex === toIndex
  ) {
    return layers;
  }
  const result = [...layers];
  const [moved] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, moved);
  return result;
}

export function toggleLayerVisibility(layers: Layer[], layerId: string): Layer[] {
  return layers.map((l) =>
    l.id === layerId ? { ...l, visible: !l.visible } : l,
  );
}

export function renameLayer(
  layers: Layer[],
  layerId: string,
  name: string,
): Layer[] {
  return layers.map((l) => (l.id === layerId ? { ...l, name } : l));
}

export function setActiveLayerId(layers: Layer[], layerId: string): string | null {
  return layers.some((l) => l.id === layerId) ? layerId : null;
}

export function resolveActiveLayerAfterRemoval(
  layers: Layer[],
  removedId: string,
  currentActiveId: string,
): string {
  if (currentActiveId !== removedId) return currentActiveId;
  const removedIndex = layers.findIndex((l) => l.id === removedId);
  const remaining = layers.filter((l) => l.id !== removedId);
  if (remaining.length === 0) return currentActiveId;
  const nextIndex = Math.min(removedIndex, remaining.length - 1);
  return remaining[nextIndex].id;
}

export function getFirstReferenceLayer(layers: Layer[]): Layer | undefined {
  return layers.find((l) => l.type === "reference");
}

export function getDefaultDrawingLayer(layers: Layer[]): Layer | undefined {
  return layers.find((l) => l.type === "drawing");
}

export function resizeLayerPixels(
  pixels: Uint32Array,
  oldSize: CanvasSize,
  newSize: CanvasSize,
): Uint32Array {
  const result = new Uint32Array(newSize.width * newSize.height);
  const copyWidth = Math.min(oldSize.width, newSize.width);
  const copyHeight = Math.min(oldSize.height, newSize.height);

  for (let y = 0; y < copyHeight; y++) {
    for (let x = 0; x < copyWidth; x++) {
      const oldIdx = y * oldSize.width + x;
      const newIdx = y * newSize.width + x;
      result[newIdx] = pixels[oldIdx];
    }
  }

  return result;
}

export function resizeAllLayers(
  layers: Layer[],
  oldSize: CanvasSize,
  newSize: CanvasSize,
): Layer[] {
  if (oldSize.width === newSize.width && oldSize.height === newSize.height) {
    return layers;
  }
  return layers.map((layer) => ({
    ...layer,
    pixels: resizeLayerPixels(layer.pixels, oldSize, newSize),
  }));
}

export function projectHasLayerContent(layers: Layer[]): boolean {
  return layers.some((l) => l.pixels.some((p) => p !== TRANSPARENT && p !== 0));
}

export function countLayersByType(layers: Layer[], type: LayerType): number {
  return layers.filter((l) => l.type === type).length;
}
