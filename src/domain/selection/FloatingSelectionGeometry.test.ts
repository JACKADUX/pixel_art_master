import { describe, expect, it } from "vitest";
import { createEmptyDrawingLayer } from "@/domain/layer/Layer";
import { getLayerGrid } from "@/domain/layer/LayerOperations";
import { wrapLayerOnCanvas } from "@/domain/canvas/LayerProjectedSurface";
import { rgba } from "@/domain/canvas/PixelColor";
import { PixelGrid } from "@/domain/canvas/PixelGrid";
import {
  getFloatingRestoreCanvasCornerPoints,
  getFloatingSelectionCanvasCornerPoints,
} from "@/domain/selection/FloatingSelectionGeometry";
import { createSelectionState } from "@/domain/selection/SelectionState";
import { commitFloatingSelectionInProject } from "@/application/use-cases/SelectionUseCases";
import { createEmptyProject, getCompositeGrid } from "@/domain/project/Project";
import { getActiveCanvas, mutateActiveCanvas } from "@/domain/project/ProjectTestUtils";

describe("FloatingSelectionGeometry", () => {
  it("returns canvas corner points for floating offset", () => {
    const floating = {
      pixels: PixelGrid.createEmpty(4, 3),
      offset: { x: 10, y: 5 },
      originInLayer: { x: 0, y: 0 },
      source: "layer" as const,
    };

    expect(getFloatingSelectionCanvasCornerPoints(floating)).toEqual([
      { x: 10, y: 5 },
      { x: 13, y: 7 },
    ]);
  });

  it("returns canvas corner points for restore origin", () => {
    const floating = {
      pixels: PixelGrid.createEmpty(4, 3),
      offset: { x: 20, y: 20 },
      originInLayer: { x: 2, y: 1 },
      source: "layer" as const,
    };

    expect(getFloatingRestoreCanvasCornerPoints(floating, { x: 8, y: 6 })).toEqual([
      { x: 10, y: 7 },
      { x: 13, y: 9 },
    ]);
  });
});

describe("commitFloatingSelectionInProject", () => {
  it("expands layer before committing floating selection outside layer bounds", () => {
    const layer = createEmptyDrawingLayer({ width: 16, height: 16 });
    layer.pixels[0] = rgba(255, 0, 0, 255);

    const project = mutateActiveCanvas(createEmptyProject("test", { width: 64, height: 64 }), {
      layers: [layer],
      activeLayerId: layer.id,
    });

    const floatingPixels = PixelGrid.createEmpty(4, 4);
    floatingPixels.setPixel(1, 1, rgba(0, 0, 255, 255));
    const selection = createSelectionState({
      width: 64,
      height: 64,
      data: new Uint8Array(64 * 64),
    });
    selection.floating = {
      pixels: floatingPixels,
      offset: { x: 30, y: 30 },
      originInLayer: { x: 0, y: 0 },
      source: "layer",
    };

    const { project: committedProject, selection: committedSelection } =
      commitFloatingSelectionInProject(project, selection);

    expect(committedSelection.floating).toBeNull();
    const committedLayer = getActiveCanvas(committedProject).layers[0];
    expect(committedLayer.type).toBe("drawing");
    if (committedLayer.type !== "drawing") return;

    expect(committedLayer.width).toBeGreaterThanOrEqual(34);
    expect(committedLayer.height).toBeGreaterThanOrEqual(34);

    const grid = getLayerGrid(committedLayer);
    const surface = wrapLayerOnCanvas(grid, committedLayer.position, { width: 64, height: 64 });
    expect(surface.getPixel(31, 31)).toBe(rgba(0, 0, 255, 255));
    expect(() => getCompositeGrid(committedProject)).not.toThrow();
  });
});
