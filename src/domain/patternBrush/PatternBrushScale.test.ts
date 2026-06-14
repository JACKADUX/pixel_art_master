import { describe, expect, it } from "vitest";
import { PixelGrid } from "@/domain/canvas/PixelGrid";
import { rgba } from "@/domain/canvas/PixelColor";
import { scalePixelGridNearest } from "./PatternBrushScale";

describe("PatternBrushScale", () => {
  it("returns null at 0%", () => {
    const grid = PixelGrid.createEmpty(4, 4);
    expect(scalePixelGridNearest(grid, 0)).toBeNull();
  });

  it("returns same grid at 100%", () => {
    const grid = PixelGrid.createEmpty(4, 4);
    grid.setPixel(1, 1, rgba(255, 0, 0));
    expect(scalePixelGridNearest(grid, 100)).toBe(grid);
  });

  it("doubles dimensions at 200%", () => {
    const grid = PixelGrid.createEmpty(2, 2);
    grid.setPixel(0, 0, rgba(255, 0, 0));
    grid.setPixel(1, 1, rgba(0, 255, 0));
    const scaled = scalePixelGridNearest(grid, 200);
    expect(scaled).not.toBeNull();
    expect(scaled!.width).toBe(4);
    expect(scaled!.height).toBe(4);
    expect(scaled!.getPixel(0, 0)).toBe(rgba(255, 0, 0));
    expect(scaled!.getPixel(3, 3)).toBe(rgba(0, 255, 0));
  });
});
