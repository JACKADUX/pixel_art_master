import { describe, expect, it } from "vitest";
import { PixelGrid } from "@/domain/canvas/PixelGrid";
import { TiledPixelSurface } from "@/domain/canvas/TiledPixelSurface";
import { rgba } from "@/domain/canvas/PixelColor";

describe("TiledPixelSurface", () => {
  const region = { x: 10, y: 10, width: 4, height: 3 };

  it("replicates setPixel to all 9 tile cells", () => {
    const grid = PixelGrid.createEmpty(32, 32);
    const surface = new TiledPixelSurface(grid, region);
    const color = rgba(255, 0, 0, 255);

    surface.setPixel(11, 11, color);

    expect(grid.getPixel(11, 11)).toBe(color);
    expect(grid.getPixel(7, 11)).toBe(color);
    expect(grid.getPixel(15, 14)).toBe(color);
  });

  it("ignores setPixel outside the 9-tile union", () => {
    const grid = PixelGrid.createEmpty(32, 32);
    const surface = new TiledPixelSurface(grid, region);
    const color = rgba(255, 0, 0, 255);

    surface.setPixel(0, 0, color);

    expect(grid.getPixel(0, 0)).toBe(0);
  });
});
