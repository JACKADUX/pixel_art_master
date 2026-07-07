import type { PixelCanvas } from "./PixelCanvas";
import type { ReferenceLayer } from "../layer/Layer";
import { getReferenceBounds } from "../layer/ReferenceLayerOperations";
import {
  computePanMargin,
  WORKSPACE_CONTAINER_FALLBACK_HEIGHT,
  WORKSPACE_CONTAINER_FALLBACK_WIDTH,
  type ScrollPosition,
  type WorkspaceStageLayout,
} from "../viewport/WorkspaceLayout";

export interface BoardCanvasLayout {
  canvasId: string;
  left: number;
  top: number;
  displayWidth: number;
  displayHeight: number;
}

export interface BoardLayout {
  stageWidth: number;
  stageHeight: number;
  /** 工作区固定原点（舞台坐标），用于视口/导航计算 */
  originLeft: number;
  originTop: number;
  /** 将内容移入可滚动区域（避免负坐标被裁切） */
  contentShiftX: number;
  contentShiftY: number;
  canvases: BoardCanvasLayout[];
}

export interface BoardContentBounds {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface StageRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** 参考层控件（工具栏/色板）在舞台坐标中额外占用的边距 */
const REFERENCE_STAGE_CHROME_INSET = {
  left: 8,
  top: 48,
  right: 8,
  bottom: 96,
} as const;

export function boardRenderOrigin(boardLayout: BoardLayout): {
  left: number;
  top: number;
} {
  return {
    left: boardLayout.originLeft + boardLayout.contentShiftX,
    top: boardLayout.originTop + boardLayout.contentShiftY,
  };
}

function referenceStageRect(
  originLeft: number,
  originTop: number,
  layer: ReferenceLayer,
  zoom: number,
): StageRect | null {
  const bounds = getReferenceBounds(layer, zoom);
  if (!bounds) return null;

  const left = originLeft + bounds.left - REFERENCE_STAGE_CHROME_INSET.left;
  const top = originTop + bounds.top - REFERENCE_STAGE_CHROME_INSET.top;
  const right =
    originLeft + bounds.left + bounds.width + REFERENCE_STAGE_CHROME_INSET.right;
  const bottom =
    originTop + bounds.top + bounds.height + REFERENCE_STAGE_CHROME_INSET.bottom;

  return { left, top, right, bottom };
}

function collectBoardStageRects(
  originLeft: number,
  originTop: number,
  canvases: BoardCanvasLayout[],
  referenceLayers: ReferenceLayer[],
  zoom: number,
): StageRect[] {
  const rects: StageRect[] = canvases.map((layout) => ({
    left: layout.left,
    top: layout.top,
    right: layout.left + layout.displayWidth,
    bottom: layout.top + layout.displayHeight,
  }));

  for (const layer of referenceLayers) {
    const rect = referenceStageRect(originLeft, originTop, layer, zoom);
    if (rect) rects.push(rect);
  }

  return rects;
}

function resolveBoardStageLayout(
  containerWidth: number,
  containerHeight: number,
  marginX: number,
  marginY: number,
  rects: StageRect[],
): Pick<
  BoardLayout,
  "stageWidth" | "stageHeight" | "contentShiftX" | "contentShiftY"
> {
  if (rects.length === 0) {
    return {
      stageWidth: Math.max(containerWidth, WORKSPACE_CONTAINER_FALLBACK_WIDTH),
      stageHeight: Math.max(containerHeight, WORKSPACE_CONTAINER_FALLBACK_HEIGHT),
      contentShiftX: 0,
      contentShiftY: 0,
    };
  }

  let minLeft = Infinity;
  let minTop = Infinity;
  let maxRight = -Infinity;
  let maxBottom = -Infinity;

  for (const rect of rects) {
    minLeft = Math.min(minLeft, rect.left);
    minTop = Math.min(minTop, rect.top);
    maxRight = Math.max(maxRight, rect.right);
    maxBottom = Math.max(maxBottom, rect.bottom);
  }

  const contentShiftX = minLeft < marginX ? marginX - minLeft : 0;
  const contentShiftY = minTop < marginY ? marginY - minTop : 0;

  const shiftedMaxRight = maxRight + contentShiftX;
  const shiftedMaxBottom = maxBottom + contentShiftY;

  return {
    stageWidth: Math.max(containerWidth, shiftedMaxRight + marginX),
    stageHeight: Math.max(containerHeight, shiftedMaxBottom + marginY),
    contentShiftX,
    contentShiftY,
  };
}

/** 画板在舞台中使用固定绝对坐标，不随画板集合变化而整体平移 */
export function computeBoardLayout(
  containerWidth: number,
  containerHeight: number,
  canvases: PixelCanvas[],
  zoom: number,
  referenceLayers: ReferenceLayer[] = [],
): BoardLayout {
  const marginX = computePanMargin(containerWidth);
  const marginY = computePanMargin(containerHeight);
  const originLeft = marginX;
  const originTop = marginY;

  const baseLayouts: BoardCanvasLayout[] = canvases.map((canvas) => ({
    canvasId: canvas.id,
    left: originLeft + canvas.boardPosition.x * zoom,
    top: originTop + canvas.boardPosition.y * zoom,
    displayWidth: canvas.width * zoom,
    displayHeight: canvas.height * zoom,
  }));

  const rects = collectBoardStageRects(
    originLeft,
    originTop,
    baseLayouts,
    referenceLayers,
    zoom,
  );
  const stage = resolveBoardStageLayout(
    containerWidth,
    containerHeight,
    marginX,
    marginY,
    rects,
  );

  const shiftedLayouts = baseLayouts.map((layout) => ({
    ...layout,
    left: layout.left + stage.contentShiftX,
    top: layout.top + stage.contentShiftY,
  }));

  return {
    stageWidth: stage.stageWidth,
    stageHeight: stage.stageHeight,
    originLeft,
    originTop,
    contentShiftX: stage.contentShiftX,
    contentShiftY: stage.contentShiftY,
    canvases: shiftedLayouts,
  };
}

/** 画板像素合成区在完整内容区中的显示矩形（不含参考层扩展） */
export function computeCanvasCompositeDisplayRect(
  boardLayout: BoardLayout,
  boardContent: BoardContentBounds,
  zoom = 1,
): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const canvasBounds = computeBoardContentBounds(boardLayout, [], zoom);
  return {
    x: canvasBounds.left - boardContent.left,
    y: canvasBounds.top - boardContent.top,
    width: canvasBounds.width,
    height: canvasBounds.height,
  };
}

export function computeBoardContentBounds(
  boardLayout: BoardLayout,
  referenceLayers: ReferenceLayer[] = [],
  zoom = 1,
): BoardContentBounds {
  const renderOrigin = boardRenderOrigin(boardLayout);
  const rects = collectBoardStageRects(
    renderOrigin.left,
    renderOrigin.top,
    boardLayout.canvases,
    referenceLayers,
    zoom,
  );

  if (rects.length === 0) {
    return {
      left: renderOrigin.left,
      top: renderOrigin.top,
      width: 0,
      height: 0,
    };
  }

  let minLeft = Infinity;
  let minTop = Infinity;
  let maxRight = -Infinity;
  let maxBottom = -Infinity;

  for (const rect of rects) {
    minLeft = Math.min(minLeft, rect.left);
    minTop = Math.min(minTop, rect.top);
    maxRight = Math.max(maxRight, rect.right);
    maxBottom = Math.max(maxBottom, rect.bottom);
  }

  return {
    left: minLeft,
    top: minTop,
    width: maxRight - minLeft,
    height: maxBottom - minTop,
  };
}

export function computeBoardStageScrollLimits(
  boardLayout: BoardLayout,
  containerWidth: number,
  containerHeight: number,
): { maxScrollX: number; maxScrollY: number } {
  return {
    maxScrollX: Math.max(0, boardLayout.stageWidth - containerWidth),
    maxScrollY: Math.max(0, boardLayout.stageHeight - containerHeight),
  };
}

/** 是否可通过平移让指定舞台矩形完整进入视口 */
export function canRevealStageRectInViewport(
  boardLayout: BoardLayout,
  containerWidth: number,
  containerHeight: number,
  rect: StageRect,
): boolean {
  const width = rect.right - rect.left;
  const height = rect.bottom - rect.top;
  if (width <= 0 || height <= 0) return true;

  const { maxScrollX, maxScrollY } = computeBoardStageScrollLimits(
    boardLayout,
    containerWidth,
    containerHeight,
  );

  const minScrollX = Math.max(0, rect.left);
  const minScrollY = Math.max(0, rect.top);
  const maxRequiredScrollX = Math.max(0, rect.right - containerWidth);
  const maxRequiredScrollY = Math.max(0, rect.bottom - containerHeight);

  return (
    minScrollX <= maxScrollX &&
    minScrollY <= maxScrollY &&
    maxRequiredScrollX <= maxScrollX &&
    maxRequiredScrollY <= maxScrollY
  );
}

export function hitTestBoardCanvas(
  boardLayout: BoardLayout,
  stageX: number,
  stageY: number,
): string | null {
  for (let i = boardLayout.canvases.length - 1; i >= 0; i -= 1) {
    const layout = boardLayout.canvases[i];
    if (
      stageX >= layout.left &&
      stageX < layout.left + layout.displayWidth &&
      stageY >= layout.top &&
      stageY < layout.top + layout.displayHeight
    ) {
      return layout.canvasId;
    }
  }
  return null;
}

export interface CanvasDropTarget {
  canvasId: string;
  canvasPoint: { x: number; y: number };
}

/** 将舞台坐标解析为鼠标下方的画板及其局部像素坐标 */
export function resolveCanvasDropTarget(
  boardLayout: BoardLayout,
  stageX: number,
  stageY: number,
  zoom: number,
): CanvasDropTarget | null {
  const canvasId = hitTestBoardCanvas(boardLayout, stageX, stageY);
  if (!canvasId) return null;

  const layout = boardLayout.canvases.find((entry) => entry.canvasId === canvasId);
  if (!layout) return null;

  const canvasPoint = stageToCanvasPoint(layout, stageX, stageY, zoom);
  if (!canvasPoint) return null;

  return { canvasId, canvasPoint };
}

/** 将舞台坐标转换为工作区（画板）绝对坐标 */
export function stagePointToBoardPoint(
  boardLayout: BoardLayout,
  stageX: number,
  stageY: number,
  zoom: number,
): { x: number; y: number } {
  const origin = boardRenderOrigin(boardLayout);
  return {
    x: Math.floor((stageX - origin.left) / zoom),
    y: Math.floor((stageY - origin.top) / zoom),
  };
}

export function stageToCanvasPoint(
  layout: BoardCanvasLayout,
  stageX: number,
  stageY: number,
  zoom: number,
): { x: number; y: number } | null {
  const localX = stageX - layout.left;
  const localY = stageY - layout.top;
  if (localX < 0 || localY < 0) return null;
  const pixelX = Math.floor(localX / zoom);
  const pixelY = Math.floor(localY / zoom);
  if (pixelX < 0 || pixelY < 0) return null;
  return { x: pixelX, y: pixelY };
}

export function boardLayoutToWorkspaceStage(boardLayout: BoardLayout): WorkspaceStageLayout {
  return {
    stageWidth: boardLayout.stageWidth,
    stageHeight: boardLayout.stageHeight,
    canvasLeft: boardLayout.originLeft,
    canvasTop: boardLayout.originTop,
  };
}

/** 首次打开项目时居中显示整个工作区内容，不绑定活动画板 */
export function computeBoardInitialScrollPosition(
  boardLayout: BoardLayout,
  containerWidth: number,
  containerHeight: number,
  referenceLayers: ReferenceLayer[] = [],
  zoom = 1,
): ScrollPosition {
  const bounds = computeBoardContentBounds(boardLayout, referenceLayers, zoom);
  if (bounds.width <= 0 || bounds.height <= 0) {
    return { scrollLeft: 0, scrollTop: 0 };
  }

  const { maxScrollX, maxScrollY } = computeBoardStageScrollLimits(
    boardLayout,
    containerWidth,
    containerHeight,
  );

  return {
    scrollLeft: Math.max(
      0,
      Math.min(maxScrollX, bounds.left + bounds.width / 2 - containerWidth / 2),
    ),
    scrollTop: Math.max(
      0,
      Math.min(maxScrollY, bounds.top + bounds.height / 2 - containerHeight / 2),
    ),
  };
}
