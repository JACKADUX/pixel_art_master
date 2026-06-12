import {
  clampScrollTarget,
  mapPreviewPointToScroll,
  type NavigatorLayout,
  type ScrollTarget,
  type ViewportSnapshot,
} from "@/domain/viewport/NavigatorViewport";

export function navigateToPreviewPoint(
  previewX: number,
  previewY: number,
  snapshot: ViewportSnapshot,
  layout: NavigatorLayout,
  maxScrollX: number,
  maxScrollY: number,
): ScrollTarget | null {
  const target = mapPreviewPointToScroll(previewX, previewY, snapshot, layout);
  if (!target) return null;
  return clampScrollTarget(target, maxScrollX, maxScrollY);
}
