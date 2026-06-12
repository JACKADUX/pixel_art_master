import type { ReferenceLayer } from "@/domain/layer/Layer";
import { getReferenceBounds } from "@/domain/layer/ReferenceLayerOperations";

export const WORKSPACE_MARGIN_MIN = 800;

export const WORKSPACE_CONTAINER_FALLBACK_WIDTH = 800;
export const WORKSPACE_CONTAINER_FALLBACK_HEIGHT = 600;

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
  zoom: number,
): WorkspaceStageLayout {
  const margin = WORKSPACE_MARGIN_MIN;

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

  const contentWidth = maxX - minX;
  const contentHeight = maxY - minY;
  const offsetX = minX < 0 ? -minX : 0;
  const offsetY = minY < 0 ? -minY : 0;

  const stageWidth = Math.max(containerWidth, contentWidth + margin * 2);
  const stageHeight = Math.max(containerHeight, contentHeight + margin * 2);

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
  const margin = WORKSPACE_MARGIN_MIN;
  const stageWidth = Math.max(
    containerWidth,
    canvasDisplayWidth + margin * 2,
  );
  const stageHeight = Math.max(
    containerHeight,
    canvasDisplayHeight + margin * 2,
  );

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
