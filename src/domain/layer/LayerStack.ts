import type { Layer } from "./Layer";

/** 参考层在前、绘制层在后，数组索引越大越靠上（绘制层内 / 参考层内各自堆叠） */
export function normalizeLayerStack(layers: Layer[]): Layer[] {
  const references = layers.filter((layer) => layer.type === "reference");
  const drawings = layers.filter((layer) => layer.type === "drawing");
  return [...references, ...drawings];
}

export function countReferenceLayers(layers: Layer[]): number {
  return layers.filter((layer) => layer.type === "reference").length;
}

export function getReferenceStackIndex(layers: Layer[], layerId: string): number {
  let index = 0;
  for (const layer of layers) {
    if (layer.type !== "reference") continue;
    if (layer.id === layerId) return index;
    index += 1;
  }
  return -1;
}

export function clampLayerReorderTarget(
  layers: Layer[],
  fromIndex: number,
  toIndex: number,
): number {
  const stack = normalizeLayerStack(layers);
  const moved = stack[fromIndex];
  if (!moved) return toIndex;

  const referenceCount = countReferenceLayers(stack);
  if (moved.type === "reference") {
    return Math.max(0, Math.min(toIndex, referenceCount - 1));
  }

  return Math.max(referenceCount, Math.min(toIndex, stack.length - 1));
}
