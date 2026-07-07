import { describe, expect, it } from "vitest";
import {
  getOverlayPixelCoordinates,
  resolveMousePositionOverlayTarget,
} from "@/domain/grid/MousePositionOverlayTarget";
import type { ReferenceLayer } from "@/domain/layer/Layer";

function createReferenceLayer(overrides: Partial<ReferenceLayer> = {}): ReferenceLayer {
  return {
    id: "ref-1",
    type: "reference",
    name: "参考图",
    visible: true,
    position: { x: 10, y: 20 },
    imageData: "data:image/png;base64,test",
    imageSize: null,
    crop: { x: 0, y: 0, width: 32, height: 32 },
    grid: { primary: 16, secondary: 8, visible: false },
    scale: 1,
    paletteVisible: false,
    ...overrides,
  };
}

describe("resolveMousePositionOverlayTarget", () => {
  const composite = { width: 64, height: 64 };

  it("prefers reference layer when canvas point is inside it", () => {
    const layer = createReferenceLayer();
    const target = resolveMousePositionOverlayTarget(
      { x: 12, y: 22 },
      { x: 0, y: 0 },
      [layer],
      8,
      composite,
    );

    expect(target).toEqual({
      kind: "reference",
      localX: 2,
      localY: 2,
      secondarySize: 8,
      canvasCellOrigin: { x: 10, y: 20 },
    });
  });

  it("uses canvas target when point is only inside the drawing canvas", () => {
    const layer = createReferenceLayer({ position: { x: 80, y: 80 } });
    const target = resolveMousePositionOverlayTarget(
      { x: 4, y: 6 },
      { x: 0, y: 0 },
      [layer],
      8,
      composite,
    );

    expect(target).toEqual({
      kind: "canvas",
      pixelX: 4,
      pixelY: 6,
      secondarySize: 8,
      canvasCellOrigin: { x: 0, y: 0 },
    });
  });

  it("returns null when point is outside canvas and reference layers", () => {
    const layer = createReferenceLayer({ position: { x: 80, y: 80 } });
    const target = resolveMousePositionOverlayTarget(
      { x: 70, y: 70 },
      { x: 0, y: 0 },
      [layer],
      8,
      composite,
    );

    expect(target).toBeNull();
  });
});

describe("getOverlayPixelCoordinates", () => {
  it("returns local coordinates for reference targets", () => {
    expect(
      getOverlayPixelCoordinates({
        kind: "reference",
        localX: 3,
        localY: 5,
        secondarySize: 8,
        canvasCellOrigin: { x: 10, y: 20 },
      }),
    ).toEqual({ x: 3, y: 5 });
  });
});
