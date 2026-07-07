import { describe, expect, it } from "vitest";
import { PixelGrid } from "./PixelGrid";
import { wrapLayerOnCanvas } from "./LayerProjectedSurface";
import { rgba } from "./PixelColor";

describe("LayerProjectedSurface", () => {
  it("reads and writes pixels through canvas coordinates", () => {
    const layerGrid = PixelGrid.createEmpty(4, 4);
    const surface = wrapLayerOnCanvas(layerGrid, { x: 2, y: 1 }, { width: 8, height: 8 });

    surface.setPixel(3, 2, rgba(0, 255, 0, 255));
    expect(surface.getPixel(3, 2)).toBe(rgba(0, 255, 0, 255));
    expect(layerGrid.getPixel(1, 1)).toBe(rgba(0, 255, 0, 255));
    expect(surface.inBounds(3, 2)).toBe(true);
    expect(surface.inBounds(1, 0)).toBe(false);
  });
});
