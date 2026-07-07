import type { ReferenceLayer } from "../layer/Layer";
import {
  clampEditorZoom,
  EDITOR_MAX_ZOOM,
  EDITOR_MIN_ZOOM,
} from "../viewport/EditorZoom";
import type { ScrollPosition } from "../viewport/WorkspaceLayout";
import type { BoardCanvasLayout, BoardLayout } from "./BoardLayout";
import { computeBoardLayout, computeBoardStageScrollLimits } from "./BoardLayout";
import type { CanvasBoard } from "./CanvasBoard";
import { resolveCanvas } from "./CanvasBoard";

export const ACTIVE_CANVAS_FIT_ZOOM_MIN = EDITOR_MIN_ZOOM;
export const ACTIVE_CANVAS_FIT_ZOOM_MAX = EDITOR_MAX_ZOOM;
/** 适配视口时保留少量边距，避免贴边 */
export const ACTIVE_CANVAS_FIT_PADDING_RATIO = 0.92;

export function computeFitZoomForActiveCanvas(
  containerWidth: number,
  containerHeight: number,
  canvasWidth: number,
  canvasHeight: number,
): number {
  if (
    containerWidth <= 0 ||
    containerHeight <= 0 ||
    canvasWidth <= 0 ||
    canvasHeight <= 0
  ) {
    return ACTIVE_CANVAS_FIT_ZOOM_MIN;
  }

  const paddedWidth = containerWidth * ACTIVE_CANVAS_FIT_PADDING_RATIO;
  const paddedHeight = containerHeight * ACTIVE_CANVAS_FIT_PADDING_RATIO;
  const fit = Math.min(paddedWidth / canvasWidth, paddedHeight / canvasHeight);

  return clampEditorZoom(fit);
}

export function computeActiveCanvasCenterScroll(
  activeCanvasLayout: BoardCanvasLayout,
  containerWidth: number,
  containerHeight: number,
  boardLayout: BoardLayout,
): ScrollPosition {
  const centerX = activeCanvasLayout.left + activeCanvasLayout.displayWidth / 2;
  const centerY = activeCanvasLayout.top + activeCanvasLayout.displayHeight / 2;
  const { maxScrollX, maxScrollY } = computeBoardStageScrollLimits(
    boardLayout,
    containerWidth,
    containerHeight,
  );

  return {
    scrollLeft: Math.max(0, Math.min(maxScrollX, centerX - containerWidth / 2)),
    scrollTop: Math.max(0, Math.min(maxScrollY, centerY - containerHeight / 2)),
  };
}

export interface FitActiveCanvasViewportPlan {
  zoom: number;
  scrollLeft: number;
  scrollTop: number;
}

export function planFitActiveCanvasViewport(
  containerWidth: number,
  containerHeight: number,
  board: CanvasBoard,
  referenceLayers: ReferenceLayer[],
): FitActiveCanvasViewportPlan | null {
  const activeCanvas = resolveCanvas(board, board.activeCanvasId);
  if (!activeCanvas) return null;

  const zoom = computeFitZoomForActiveCanvas(
    containerWidth,
    containerHeight,
    activeCanvas.width,
    activeCanvas.height,
  );
  const boardLayout = computeBoardLayout(
    containerWidth,
    containerHeight,
    board.canvases,
    zoom,
    referenceLayers,
  );
  const activeCanvasLayout = boardLayout.canvases.find(
    (layout) => layout.canvasId === activeCanvas.id,
  );
  if (!activeCanvasLayout) return null;

  const scroll = computeActiveCanvasCenterScroll(
    activeCanvasLayout,
    containerWidth,
    containerHeight,
    boardLayout,
  );

  return {
    zoom,
    scrollLeft: scroll.scrollLeft,
    scrollTop: scroll.scrollTop,
  };
}
