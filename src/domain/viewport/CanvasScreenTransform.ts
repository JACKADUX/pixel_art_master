/** Maps logical canvas coordinates to CSS pixels in a viewport overlay. */
export interface CanvasScreenTransform {
  /** Canvas top-left in overlay CSS pixel space. */
  offsetX: number;
  offsetY: number;
  /** CSS pixels per logical canvas pixel (= editor zoom). */
  zoom: number;
}

/** Stage-local transform for overlays inside a scroll-offset wrapper. */
export function canvasStageScreenTransform(
  canvasStageLeft: number,
  canvasStageTop: number,
  zoom: number,
): CanvasScreenTransform {
  return {
    offsetX: canvasStageLeft,
    offsetY: canvasStageTop,
    zoom,
  };
}

export function canvasScreenTransformFromViewport(
  canvasStageLeft: number,
  canvasStageTop: number,
  scrollLeft: number,
  scrollTop: number,
  zoom: number,
): CanvasScreenTransform {
  return {
    offsetX: canvasStageLeft - scrollLeft,
    offsetY: canvasStageTop - scrollTop,
    zoom,
  };
}

export function logicalToScreenX(x: number, transform: CanvasScreenTransform): number {
  return transform.offsetX + x * transform.zoom;
}

export function logicalToScreenY(y: number, transform: CanvasScreenTransform): number {
  return transform.offsetY + y * transform.zoom;
}

export function logicalRectToScreenWidth(width: number, transform: CanvasScreenTransform): number {
  return width * transform.zoom;
}

export function logicalRectToScreenHeight(height: number, transform: CanvasScreenTransform): number {
  return height * transform.zoom;
}
