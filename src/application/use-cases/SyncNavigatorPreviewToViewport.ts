import {
  computePreviewSyncForViewport,
  type NavigatorLayout,
  type PreviewPan,
  type ViewportSnapshot,
} from "@/domain/viewport/NavigatorViewport";

export interface SyncNavigatorPreviewResult {
  previewScale: number;
  previewPan: PreviewPan;
}

export function syncNavigatorPreviewToViewport(
  snapshot: ViewportSnapshot,
  layout: Pick<NavigatorLayout, "previewWidth" | "previewHeight">,
): SyncNavigatorPreviewResult | null {
  return computePreviewSyncForViewport(snapshot, layout);
}
