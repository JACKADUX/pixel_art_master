import { describe, expect, it } from "vitest";
import { PixelGrid } from "@/domain/canvas/PixelGrid";
import { rgba, TRANSPARENT } from "@/domain/canvas/PixelColor";
import { computePatternTopLeft, stampPatternAt } from "./PatternBrushStamp";

describe("PatternBrushStamp", () => {
  it("stamps pattern centered on cursor", () => {
    const source = PixelGrid.createEmpty(2, 2);
    source.setPixel(0, 0, rgba(255, 0, 0, 255));
    source.setPixel(1, 1, rgba(0, 255, 0, 255));

    const grid = PixelGrid.createEmpty(5, 5);
    stampPatternAt(grid, { x: 2, y: 2 }, {
      source,
      scalePercent: 100,
      drawMode: "foreground",
      foregroundColor: rgba(255, 0, 0, 255),
      backgroundColor: TRANSPARENT,
      applyForegroundTint: false,
    });

    expect(grid.getPixel(1, 1)).toBe(rgba(255, 0, 0, 255));
    expect(grid.getPixel(2, 2)).toBe(rgba(0, 255, 0, 255));
    expect(grid.getPixel(0, 0)).toBe(TRANSPARENT);
  });

  it("computePatternTopLeft centers odd and even sizes", () => {
    expect(computePatternTopLeft({ x: 5, y: 5 }, 3, 3)).toEqual({ x: 4, y: 4 });
    expect(computePatternTopLeft({ x: 5, y: 5 }, 2, 2)).toEqual({ x: 4, y: 4 });
  });

  it("skips transparent source pixels", () => {
    const source = PixelGrid.createEmpty(2, 2);
    source.setPixel(1, 0, rgba(255, 0, 0, 255));

    const grid = PixelGrid.createEmpty(4, 4);
    stampPatternAt(grid, { x: 2, y: 1 }, {
      source,
      scalePercent: 100,
      drawMode: "foreground",
      foregroundColor: rgba(255, 0, 0, 255),
      backgroundColor: TRANSPARENT,
      applyForegroundTint: true,
    });

    expect(grid.getPixel(1, 0)).toBe(TRANSPARENT);
    expect(grid.getPixel(2, 0)).toBe(rgba(255, 0, 0, 255));
  });

  it("clips at grid boundaries", () => {
    const source = PixelGrid.createEmpty(3, 3);
    source.setPixel(0, 0, rgba(255, 0, 0, 255));

    const grid = PixelGrid.createEmpty(2, 2);
    stampPatternAt(grid, { x: 1, y: 1 }, {
      source,
      scalePercent: 100,
      drawMode: "foreground",
      foregroundColor: rgba(255, 0, 0, 255),
      backgroundColor: TRANSPARENT,
      applyForegroundTint: false,
    });

    expect(grid.getPixel(0, 0)).toBe(rgba(255, 0, 0, 255));
  });

  it("erases with transparent background on right-click draw mode", () => {
    const source = PixelGrid.createEmpty(2, 2);
    source.setPixel(0, 0, rgba(255, 0, 0, 255));
    source.setPixel(1, 0, rgba(0, 255, 0, 200));

    const grid = PixelGrid.createEmpty(4, 4);
    grid.setPixel(0, 0, rgba(255, 255, 255, 255));
    grid.setPixel(1, 0, rgba(255, 255, 255, 255));

    stampPatternAt(grid, { x: 1, y: 1 }, {
      source,
      scalePercent: 100,
      drawMode: "background",
      foregroundColor: rgba(255, 0, 0, 255),
      backgroundColor: TRANSPARENT,
      applyForegroundTint: false,
    });

    expect(grid.getPixel(0, 0)).toBe(TRANSPARENT);
    expect(grid.getPixel(1, 0)).toBe(TRANSPARENT);
  });
});
