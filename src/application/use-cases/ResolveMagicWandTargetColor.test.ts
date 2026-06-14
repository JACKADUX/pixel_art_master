import { describe, expect, it } from "vitest";
import { PixelGrid } from "@/domain/canvas/PixelGrid";
import { rgba } from "@/domain/canvas/PixelColor";
import { createEmptyReferenceLayer } from "@/domain/layer/Layer";
import { createEmptyProject, withLayers } from "@/domain/project/Project";
import { resolveMagicWandTargetColor } from "@/application/use-cases/ResolveMagicWandTargetColor";
import type { ReferenceLayerPixelData } from "@/infrastructure/canvas/ReferenceLayerPixelCache";

describe("resolveMagicWandTargetColor", () => {
  it("uses reference layer color when point is on reference", () => {
    const reference = createEmptyReferenceLayer("ref");
    reference.imageData = "base64";
    reference.imageSize = { width: 4, height: 4 };
    reference.crop = { x: 0, y: 0, width: 4, height: 4 };
    reference.position = { x: 2, y: 2 };

    const baseProject = createEmptyProject("test");
    const project = withLayers(baseProject, [...baseProject.canvas.layers, reference]);
    const grid = PixelGrid.createEmpty(64, 64);

    const cache: ReferenceLayerPixelData = {
      base64: "base64",
      cropKey: "0,0,4,4",
      width: 4,
      height: 4,
      pixels: new Uint32Array([
        rgba(255, 0, 0),
        rgba(255, 0, 0),
        rgba(255, 0, 0),
        rgba(255, 0, 0),
        rgba(255, 0, 0),
        rgba(255, 0, 0),
        rgba(255, 0, 0),
        rgba(255, 0, 0),
        rgba(255, 0, 0),
        rgba(255, 0, 0),
        rgba(255, 0, 0),
        rgba(255, 0, 0),
        rgba(255, 0, 0),
        rgba(255, 0, 0),
        rgba(255, 0, 0),
        rgba(255, 0, 0),
      ]),
    };

    const color = resolveMagicWandTargetColor(
      project,
      grid,
      { x: 3, y: 3 },
      (layerId) => (layerId === reference.id ? cache : null),
    );

    expect(color).toBe(rgba(255, 0, 0));
  });

  it("falls back to active layer pixel when point is outside reference", () => {
    const project = createEmptyProject("test");
    const grid = PixelGrid.createEmpty(64, 64);
    grid.setPixel(1, 1, rgba(0, 255, 0));

    const color = resolveMagicWandTargetColor(project, grid, { x: 1, y: 1 }, () => null);

    expect(color).toBe(rgba(0, 255, 0));
  });
});
