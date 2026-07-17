export interface ViewportSnapshot {
  scrollX: number;
  scrollY: number;
  containerWidth: number;
  containerHeight: number;
  canvasDisplayWidth: number;
  canvasDisplayHeight: number;
  canvasOffsetX: number;
  canvasOffsetY: number;
  /** 画板像素合成区域，坐标相对于内容区左上角 */
  pixelGridRect?: Rect;
}

export interface NavigatorLayout {
  previewWidth: number;
  previewHeight: number;
  previewScale: number;
  previewPanX: number;
  previewPanY: number;
}

export interface PreviewPan {
  panX: number;
  panY: number;
}

export interface DisplayPoint {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ScrollTarget {
  scrollX: number;
  scrollY: number;
}

export interface PreviewTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
  drawnWidth: number;
  drawnHeight: number;
}

const MIN_PREVIEW_SCALE = 0.25;
const MAX_PREVIEW_SCALE = 10;

/** 滚轮缩放倍率，与主编辑器一致 */
export const NAVIGATOR_PREVIEW_WHEEL_ZOOM_RATIO = 1.1;

/** 导航面板 +/- 按钮每次缩放倍率 */
export const NAVIGATOR_PREVIEW_BUTTON_ZOOM_RATIO = 1.25;

export function clampPreviewScale(scale: number): number {
  return Math.max(MIN_PREVIEW_SCALE, Math.min(MAX_PREVIEW_SCALE, scale));
}

export function applyNavigatorPreviewWheelZoomRatio(
  currentScale: number,
  deltaY: number,
): number {
  if (deltaY === 0) return currentScale;
  const factor = Math.pow(NAVIGATOR_PREVIEW_WHEEL_ZOOM_RATIO, -deltaY / 100);
  return clampPreviewScale(currentScale * factor);
}

export function applyNavigatorPreviewButtonZoomRatio(
  currentScale: number,
  direction: "in" | "out",
): number {
  const factor =
    direction === "in"
      ? NAVIGATOR_PREVIEW_BUTTON_ZOOM_RATIO
      : 1 / NAVIGATOR_PREVIEW_BUTTON_ZOOM_RATIO;
  return clampPreviewScale(currentScale * factor);
}

export function resolvePixelGridDisplayRect(snapshot: ViewportSnapshot): Rect {
  return (
    snapshot.pixelGridRect ?? {
      x: 0,
      y: 0,
      width: snapshot.canvasDisplayWidth,
      height: snapshot.canvasDisplayHeight,
    }
  );
}

export function mapDisplayRectToPreview(
  rect: Rect,
  snapshot: ViewportSnapshot,
  layout: NavigatorLayout,
): Rect {
  const transform = computePreviewTransform(snapshot, layout);
  return {
    x: transform.offsetX + rect.x * transform.scale,
    y: transform.offsetY + rect.y * transform.scale,
    width: rect.width * transform.scale,
    height: rect.height * transform.scale,
  };
}

export function computePreviewTransform(
  snapshot: ViewportSnapshot,
  layout: NavigatorLayout,
): PreviewTransform {
  const fitScale = Math.min(
    layout.previewWidth / snapshot.canvasDisplayWidth,
    layout.previewHeight / snapshot.canvasDisplayHeight,
  );
  const scale = fitScale * layout.previewScale;
  const drawnWidth = snapshot.canvasDisplayWidth * scale;
  const drawnHeight = snapshot.canvasDisplayHeight * scale;
  const offsetX =
    (layout.previewWidth - drawnWidth) / 2 + layout.previewPanX;
  const offsetY =
    (layout.previewHeight - drawnHeight) / 2 + layout.previewPanY;

  return { scale, offsetX, offsetY, drawnWidth, drawnHeight };
}

export function computeFitPreviewScale(
  snapshot: ViewportSnapshot,
  layout: Pick<NavigatorLayout, "previewWidth" | "previewHeight">,
): number {
  return Math.min(
    layout.previewWidth / snapshot.canvasDisplayWidth,
    layout.previewHeight / snapshot.canvasDisplayHeight,
  );
}

export function resolveDisplayPointAtPreviewPosition(
  previewX: number,
  previewY: number,
  snapshot: ViewportSnapshot,
  layout: NavigatorLayout,
): DisplayPoint {
  const transform = computePreviewTransform(snapshot, layout);
  return {
    x: (previewX - transform.offsetX) / transform.scale,
    y: (previewY - transform.offsetY) / transform.scale,
  };
}

export function computePreviewPanForZoomAtPoint(
  displayPoint: DisplayPoint,
  previewX: number,
  previewY: number,
  snapshot: ViewportSnapshot,
  layout: NavigatorLayout,
): PreviewPan {
  const fitScale = computeFitPreviewScale(snapshot, layout);
  const scale = fitScale * layout.previewScale;
  const drawnWidth = snapshot.canvasDisplayWidth * scale;
  const drawnHeight = snapshot.canvasDisplayHeight * scale;
  const centerX = (layout.previewWidth - drawnWidth) / 2;
  const centerY = (layout.previewHeight - drawnHeight) / 2;
  const offsetX = previewX - displayPoint.x * scale;
  const offsetY = previewY - displayPoint.y * scale;

  return {
    panX: offsetX - centerX,
    panY: offsetY - centerY,
  };
}

export function applyPreviewPanDelta(
  panX: number,
  panY: number,
  deltaX: number,
  deltaY: number,
): PreviewPan {
  return {
    panX: panX - deltaX,
    panY: panY - deltaY,
  };
}

export function computeVisibleRect(snapshot: ViewportSnapshot): Rect {
  const visibleLeft = Math.max(0, snapshot.scrollX - snapshot.canvasOffsetX);
  const visibleTop = Math.max(0, snapshot.scrollY - snapshot.canvasOffsetY);
  const visibleRight = Math.min(
    snapshot.canvasDisplayWidth,
    snapshot.scrollX + snapshot.containerWidth - snapshot.canvasOffsetX,
  );
  const visibleBottom = Math.min(
    snapshot.canvasDisplayHeight,
    snapshot.scrollY + snapshot.containerHeight - snapshot.canvasOffsetY,
  );

  return {
    x: visibleLeft,
    y: visibleTop,
    width: Math.max(0, visibleRight - visibleLeft),
    height: Math.max(0, visibleBottom - visibleTop),
  };
}

export function mapCanvasDisplayToPreview(
  displayX: number,
  displayY: number,
  snapshot: ViewportSnapshot,
  layout: NavigatorLayout,
): { x: number; y: number } {
  const transform = computePreviewTransform(snapshot, layout);
  return {
    x: transform.offsetX + displayX * transform.scale,
    y: transform.offsetY + displayY * transform.scale,
  };
}

export function mapPreviewPointToCanvasDisplay(
  previewX: number,
  previewY: number,
  snapshot: ViewportSnapshot,
  layout: NavigatorLayout,
): { x: number; y: number } | null {
  const transform = computePreviewTransform(snapshot, layout);
  const localX = previewX - transform.offsetX;
  const localY = previewY - transform.offsetY;

  if (
    localX < 0 ||
    localY < 0 ||
    localX > transform.drawnWidth ||
    localY > transform.drawnHeight
  ) {
    return null;
  }

  return {
    x: localX / transform.scale,
    y: localY / transform.scale,
  };
}

export function mapPreviewPointToScroll(
  previewX: number,
  previewY: number,
  snapshot: ViewportSnapshot,
  layout: NavigatorLayout,
): ScrollTarget | null {
  const displayPoint = mapPreviewPointToCanvasDisplay(
    previewX,
    previewY,
    snapshot,
    layout,
  );
  if (!displayPoint) return null;

  return {
    scrollX:
      snapshot.canvasOffsetX +
      displayPoint.x -
      snapshot.containerWidth / 2,
    scrollY:
      snapshot.canvasOffsetY +
      displayPoint.y -
      snapshot.containerHeight / 2,
  };
}

export function clampScrollTarget(
  target: ScrollTarget,
  maxScrollX: number,
  maxScrollY: number,
): ScrollTarget {
  return {
    scrollX: Math.max(0, Math.min(maxScrollX, target.scrollX)),
    scrollY: Math.max(0, Math.min(maxScrollY, target.scrollY)),
  };
}

export function mapVisibleRectToPreview(
  visibleRect: Rect,
  snapshot: ViewportSnapshot,
  layout: NavigatorLayout,
): Rect {
  const topLeft = mapCanvasDisplayToPreview(
    visibleRect.x,
    visibleRect.y,
    snapshot,
    layout,
  );
  const bottomRight = mapCanvasDisplayToPreview(
    visibleRect.x + visibleRect.width,
    visibleRect.y + visibleRect.height,
    snapshot,
    layout,
  );

  return {
    x: topLeft.x,
    y: topLeft.y,
    width: bottomRight.x - topLeft.x,
    height: bottomRight.y - topLeft.y,
  };
}

export interface NavigatorViewportSync {
  previewScale: number;
  previewPan: PreviewPan;
}

export function computePreviewSyncForViewport(
  snapshot: ViewportSnapshot,
  layout: Pick<NavigatorLayout, "previewWidth" | "previewHeight">,
): NavigatorViewportSync | null {
  const visibleRect = computeVisibleRect(snapshot);
  if (visibleRect.width <= 0 || visibleRect.height <= 0) {
    return null;
  }

  const fitScale = computeFitPreviewScale(snapshot, layout);
  const scaleX = layout.previewWidth / (visibleRect.width * fitScale);
  const scaleY = layout.previewHeight / (visibleRect.height * fitScale);
  const previewScale = clampPreviewScale(Math.min(scaleX, scaleY));

  const scale = fitScale * previewScale;
  const drawnWidth = snapshot.canvasDisplayWidth * scale;
  const drawnHeight = snapshot.canvasDisplayHeight * scale;
  const centerX = visibleRect.x + visibleRect.width / 2;
  const centerY = visibleRect.y + visibleRect.height / 2;

  return {
    previewScale,
    previewPan: {
      panX: drawnWidth / 2 - centerX * scale,
      panY: drawnHeight / 2 - centerY * scale,
    },
  };
}
