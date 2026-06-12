import type { ScrollPosition, WorkspaceStageLayout } from "./WorkspaceLayout";

export interface CanvasPoint {
  x: number;
  y: number;
}

export function resolveCanvasPointAtStagePosition(
  stageX: number,
  stageY: number,
  canvasLeft: number,
  canvasTop: number,
  zoom: number,
): CanvasPoint {
  return {
    x: (stageX - canvasLeft) / zoom,
    y: (stageY - canvasTop) / zoom,
  };
}

export function resolveCanvasPointAtCursor(
  pointerOffsetX: number,
  pointerOffsetY: number,
  zoom: number,
): CanvasPoint {
  return {
    x: pointerOffsetX / zoom,
    y: pointerOffsetY / zoom,
  };
}

export function computeScrollPositionForZoomAtPoint(
  logicalPoint: CanvasPoint,
  newZoom: number,
  stageLayout: WorkspaceStageLayout,
  containerLeft: number,
  containerTop: number,
  clientX: number,
  clientY: number,
): ScrollPosition {
  return {
    scrollLeft:
      stageLayout.canvasLeft +
      logicalPoint.x * newZoom -
      (clientX - containerLeft),
    scrollTop:
      stageLayout.canvasTop +
      logicalPoint.y * newZoom -
      (clientY - containerTop),
  };
}
