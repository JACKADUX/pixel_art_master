import type { CanvasSize } from "../canvas/CanvasSize";
import { TRANSPARENT } from "../canvas/PixelColor";
import { PixelGrid } from "../canvas/PixelGrid";
import {
  createEmptyDrawingLayer,
  createEmptyReferenceLayer,
  type DrawingLayer,
  type Layer,
  type LayerType,
} from "./Layer";
import {
  clampLayerReorderTarget,
  normalizeLayerStack,
} from "./LayerStack";
import { isDrawingLayer } from "./LayerTypeGuards";

export function getLayerGrid(layer: Layer, size: CanvasSize): PixelGrid {
  if (!isDrawingLayer(layer)) {
    throw new Error("Cannot get pixel grid from reference layer");
  }
  return new PixelGrid(size, layer.pixels);
}

export function syncLayerPixels(layer: DrawingLayer, grid: PixelGrid): DrawingLayer {
  return { ...layer, pixels: grid.toUint32Array() };
}

export function addDrawingLayer(
  layers: Layer[],
  size: CanvasSize,
  name?: string,
): Layer[] {
  const newLayer = createEmptyDrawingLayer(size, name);
  return [...layers, newLayer];
}

export function addReferenceLayer(layers: Layer[], name?: string): Layer[] {
  const newLayer = createEmptyReferenceLayer(name);
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
  const movedLayer = layers[fromIndex];
  if (!movedLayer) return normalizeLayerStack(layers);

  const stack = normalizeLayerStack(layers);
  const from = stack.findIndex((layer) => layer.id === movedLayer.id);
  if (from < 0) return stack;

  const targetLayer = layers[toIndex];
  let to = targetLayer
    ? stack.findIndex((layer) => layer.id === targetLayer.id)
    : stack.length;
  if (to < 0) to = stack.length;

  const clampedToIndex = clampLayerReorderTarget(stack, from, to);
  if (from === clampedToIndex) return stack;

  const result = [...stack];
  const [moved] = result.splice(from, 1);
  result.splice(clampedToIndex, 0, moved);
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
  return resolveActiveLayerOfTypeAfterRemoval(
    layers,
    removedId,
    currentActiveId,
    "drawing",
  );
}

export function resolveActiveReferenceLayerAfterRemoval(
  layers: Layer[],
  removedId: string,
  currentActiveId: string | null,
): string | null {
  if (!currentActiveId) return null;
  return resolveActiveLayerOfTypeAfterRemoval(
    layers,
    removedId,
    currentActiveId,
    "reference",
  );
}

function resolveActiveLayerOfTypeAfterRemoval(
  layers: Layer[],
  removedId: string,
  currentActiveId: string,
  type: LayerType,
): string {
  if (currentActiveId !== removedId) {
    const current = layers.find((layer) => layer.id === currentActiveId);
    if (current?.type === type) return currentActiveId;
  }

  const remaining = layers.filter((layer) => layer.type === type && layer.id !== removedId);
  if (remaining.length === 0) return currentActiveId;

  const removedIndex = layers.findIndex((layer) => layer.id === removedId);
  for (let index = removedIndex; index >= 0; index -= 1) {
    const candidate = layers[index];
    if (candidate?.type === type && candidate.id !== removedId) {
      return candidate.id;
    }
  }

  for (let index = removedIndex + 1; index < layers.length; index += 1) {
    const candidate = layers[index];
    if (candidate?.type === type && candidate.id !== removedId) {
      return candidate.id;
    }
  }

  return remaining[0].id;
}

export function getFirstReferenceLayer(
  layers: Layer[],
): import("./Layer").ReferenceLayer | undefined {
  const layer = layers.find((l) => l.type === "reference");
  return layer?.type === "reference" ? layer : undefined;
}

export function getDefaultDrawingLayer(layers: Layer[]): DrawingLayer | undefined {
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
  return layers.map((layer) => {
    if (!isDrawingLayer(layer)) return layer;
    return {
      ...layer,
      pixels: resizeLayerPixels(layer.pixels, oldSize, newSize),
    };
  });
}

export function projectHasLayerContent(layers: Layer[]): boolean {
  return layers.some(
    (l) =>
      isDrawingLayer(l) &&
      l.pixels.some((p) => p !== TRANSPARENT && p !== 0),
  );
}

export function countLayersByType(layers: Layer[], type: LayerType): number {
  return layers.filter((l) => l.type === type).length;
}
