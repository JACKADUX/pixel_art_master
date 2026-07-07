import type { Layer } from "./Layer";
import { FLOATING_PANEL_Z_BASE } from "@/domain/viewport/FloatingPanelStack";

/** 参考图 canvas 层级基准，高于绘制层预览覆盖（2） */
export const REFERENCE_LAYER_CANVAS_Z_BASE = 3;

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

/** 参考图 canvas 层级：按堆叠顺序排列，低于控件层 */
export function computeReferenceLayerCanvasZIndex(stackIndex: number): number {
  return REFERENCE_LAYER_CANVAS_Z_BASE + stackIndex;
}

/**
 * 参考层控件（工具栏、色板、缩放手柄）层级。
 * 高于所有参考图 canvas，但始终低于悬浮插件窗（31）与弹窗（50+）。
 */
export function computeReferenceLayerChromeZIndex(
  stackIndex: number,
  isActive: boolean,
  referenceCount: number,
): number {
  const aboveAllCanvases = REFERENCE_LAYER_CANVAS_Z_BASE + referenceCount;
  const zIndex = isActive
    ? aboveAllCanvases + stackIndex
    : aboveAllCanvases - 1 + stackIndex;
  return Math.min(zIndex, FLOATING_PANEL_Z_BASE - 1);
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
