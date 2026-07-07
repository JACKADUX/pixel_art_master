import { describe, expect, it } from "vitest";
import {
  computePreviewSyncForViewport,
  computeVisibleRect,
  mapVisibleRectToPreview,
  type NavigatorLayout,
  type ViewportSnapshot,
} from "@/domain/viewport/NavigatorViewport";

function createSnapshot(
  overrides: Partial<ViewportSnapshot> = {},
): ViewportSnapshot {
  return {
    scrollX: 0,
    scrollY: 0,
    containerWidth: 400,
    containerHeight: 300,
    canvasDisplayWidth: 800,
    canvasDisplayHeight: 600,
    canvasOffsetX: 0,
    canvasOffsetY: 0,
    ...overrides,
  };
}

function createLayout(
  overrides: Partial<NavigatorLayout> = {},
): NavigatorLayout {
  return {
    previewWidth: 200,
    previewHeight: 150,
    previewScale: 1,
    previewPanX: 0,
    previewPanY: 0,
    ...overrides,
  };
}

describe("computePreviewSyncForViewport", () => {
  it("returns null when visible rect has zero size", () => {
    const snapshot = createSnapshot({
      scrollX: 1000,
      scrollY: 1000,
      containerWidth: 400,
      containerHeight: 300,
    });
    expect(computePreviewSyncForViewport(snapshot, createLayout())).toBeNull();
  });

  it("centers visible viewport in preview and fills preview area", () => {
    const snapshot = createSnapshot({
      scrollX: 100,
      scrollY: 80,
      containerWidth: 200,
      containerHeight: 150,
    });
    const layout = createLayout();
    const sync = computePreviewSyncForViewport(snapshot, layout);
    expect(sync).not.toBeNull();

    const syncedLayout = createLayout({
      previewScale: sync!.previewScale,
      previewPanX: sync!.previewPan.panX,
      previewPanY: sync!.previewPan.panY,
    });
    const visibleRect = computeVisibleRect(snapshot);
    const previewRect = mapVisibleRectToPreview(
      visibleRect,
      snapshot,
      syncedLayout,
    );

    expect(previewRect.width).toBeLessThanOrEqual(layout.previewWidth + 0.5);
    expect(previewRect.height).toBeLessThanOrEqual(layout.previewHeight + 0.5);
    expect(previewRect.x + previewRect.width / 2).toBeCloseTo(
      layout.previewWidth / 2,
      0,
    );
    expect(previewRect.y + previewRect.height / 2).toBeCloseTo(
      layout.previewHeight / 2,
      0,
    );
  });

  it("clamps preview scale to allowed range", () => {
    const snapshot = createSnapshot({
      scrollX: 0,
      scrollY: 0,
      containerWidth: 10,
      containerHeight: 10,
    });
    const sync = computePreviewSyncForViewport(snapshot, createLayout());
    expect(sync).not.toBeNull();
    expect(sync!.previewScale).toBeLessThanOrEqual(4);
    expect(sync!.previewScale).toBeGreaterThanOrEqual(0.25);
  });
});
