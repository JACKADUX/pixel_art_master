import type { DrawingLayer, ReferenceLayer } from "@/domain/layer/Layer";
import { getDrawingLayerCanvasBounds } from "@/domain/layer/DrawingLayerOperations";
import { getReferenceBounds } from "@/domain/layer/ReferenceLayerOperations";

export const WORKSPACE_MARGIN_MIN = 800;

/** 拖拽到视图边界时，画布在对侧仍保留的最小可见像素，确保不会完全拖出视野 */
export const WORKSPACE_EDGE_VISIBLE_MIN = 64;

export const WORKSPACE_CONTAINER_FALLBACK_WIDTH = 800;
export const WORKSPACE_CONTAINER_FALLBACK_HEIGHT = 600;

/**
 * 计算单轴的可拖拽边距：随容器尺寸增长，使画布始终能被拖到视图边界，
 * 拖到极限时对侧仅保留 WORKSPACE_EDGE_VISIBLE_MIN 像素。
 */
export function computePanMargin(containerSize: number): number {
  return Math.max(WORKSPACE_MARGIN_MIN, containerSize - WORKSPACE_EDGE_VISIBLE_MIN);
}

export interface WorkspaceStageLayout {
  stageWidth: number;
  stageHeight: number;
  canvasLeft: number;
  canvasTop: number;
}

export interface ScrollPosition {
  scrollLeft: number;
  scrollTop: number;
}

export function computeReferenceAwareStageSize(
  containerWidth: number,
  containerHeight: number,
  canvasDisplayWidth: number,
  canvasDisplayHeight: number,
  referenceLayers: ReferenceLayer[],
  drawingLayers: DrawingLayer[],
  zoom: number,
): WorkspaceStageLayout {
  const marginX = computePanMargin(containerWidth);
  const marginY = computePanMargin(containerHeight);

  let minX = 0;
  let minY = 0;
  let maxX = canvasDisplayWidth;
  let maxY = canvasDisplayHeight;

  for (const layer of referenceLayers) {
    const bounds = getReferenceBounds(layer, zoom);
    if (!bounds) continue;
    minX = Math.min(minX, bounds.left);
    minY = Math.min(minY, bounds.top);
    maxX = Math.max(maxX, bounds.left + bounds.width);
    maxY = Math.max(maxY, bounds.top + bounds.height);
  }

  for (const layer of drawingLayers) {
    const bounds = getDrawingLayerCanvasBounds(layer);
    const left = bounds.x * zoom;
    const top = bounds.y * zoom;
    const width = bounds.width * zoom;
    const height = bounds.height * zoom;
    minX = Math.min(minX, left);
    minY = Math.min(minY, top);
    maxX = Math.max(maxX, left + width);
    maxY = Math.max(maxY, top + height);
  }

  const contentWidth = maxX - minX;
  const contentHeight = maxY - minY;
  const offsetX = minX < 0 ? -minX : 0;
  const offsetY = minY < 0 ? -minY : 0;

  const stageWidth = Math.max(containerWidth, contentWidth + marginX * 2);
  const stageHeight = Math.max(containerHeight, contentHeight + marginY * 2);

  const canvasLeft = offsetX + (stageWidth - contentWidth) / 2 - minX;
  const canvasTop = offsetY + (stageHeight - contentHeight) / 2 - minY;

  return {
    stageWidth,
    stageHeight,
    canvasLeft,
    canvasTop,
  };
}

export function computeWorkspaceStageSize(
  containerWidth: number,
  containerHeight: number,
  canvasDisplayWidth: number,
  canvasDisplayHeight: number,
): WorkspaceStageLayout {
  const marginX = computePanMargin(containerWidth);
  const marginY = computePanMargin(containerHeight);
  const stageWidth = Math.max(
    containerWidth,
    canvasDisplayWidth + marginX * 2,
  );
  const stageHeight = Math.max(
    containerHeight,
    canvasDisplayHeight + marginY * 2,
  );

  return {
    stageWidth,
    stageHeight,
    canvasLeft: (stageWidth - canvasDisplayWidth) / 2,
    canvasTop: (stageHeight - canvasDisplayHeight) / 2,
  };
}

/** 裁剪/预览等 fit-to-view 场景：stage 不小于容器，画布居中，无额外 pan 边距 */
export function computeFitContainerStageSize(
  containerWidth: number,
  containerHeight: number,
  canvasDisplayWidth: number,
  canvasDisplayHeight: number,
): WorkspaceStageLayout {
  const stageWidth = Math.max(containerWidth, canvasDisplayWidth);
  const stageHeight = Math.max(containerHeight, canvasDisplayHeight);

  return {
    stageWidth,
    stageHeight,
    canvasLeft: (stageWidth - canvasDisplayWidth) / 2,
    canvasTop: (stageHeight - canvasDisplayHeight) / 2,
  };
}

export function computeInitialScrollPosition(
  canvasLeft: number,
  canvasTop: number,
  canvasDisplayWidth: number,
  canvasDisplayHeight: number,
  containerWidth: number,
  containerHeight: number,
): ScrollPosition {
  return {
    scrollLeft: canvasLeft - (containerWidth - canvasDisplayWidth) / 2,
    scrollTop: canvasTop - (containerHeight - canvasDisplayHeight) / 2,
  };
}

export function computeScrollCompensation(
  prev: WorkspaceStageLayout,
  next: WorkspaceStageLayout,
): ScrollPosition {
  return {
    scrollLeft: next.canvasLeft - prev.canvasLeft,
    scrollTop: next.canvasTop - prev.canvasTop,
  };
}

export function isSameWorkspaceStageLayout(
  a: WorkspaceStageLayout,
  b: WorkspaceStageLayout,
): boolean {
  return (
    a.stageWidth === b.stageWidth &&
    a.stageHeight === b.stageHeight &&
    a.canvasLeft === b.canvasLeft &&
    a.canvasTop === b.canvasTop
  );
}
