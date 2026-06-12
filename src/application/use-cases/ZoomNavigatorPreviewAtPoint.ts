import {
  clampPreviewScale,
  computePreviewPanForZoomAtPoint,
  resolveDisplayPointAtPreviewPosition,
  type NavigatorLayout,
  type PreviewPan,
  type ViewportSnapshot,
} from "@/domain/viewport/NavigatorViewport";

export interface ZoomNavigatorPreviewResult {
  previewScale: number;
  previewPan: PreviewPan;
}

export function zoomNavigatorPreviewAtPoint(
  previewX: number,
  previewY: number,
  newScale: number,
  snapshot: ViewportSnapshot,
  layout: NavigatorLayout,
): ZoomNavigatorPreviewResult {
  const previewScale = clampPreviewScale(newScale);
  const displayPoint = resolveDisplayPointAtPreviewPosition(
    previewX,
    previewY,
    snapshot,
    layout,
  );
  const previewPan = computePreviewPanForZoomAtPoint(
    displayPoint,
    previewX,
    previewY,
    snapshot,
    { ...layout, previewScale },
  );

  return { previewScale, previewPan };
}
