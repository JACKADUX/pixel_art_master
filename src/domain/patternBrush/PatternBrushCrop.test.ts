import { describe, expect, it } from "vitest";
import { PixelGrid } from "@/domain/canvas/PixelGrid";
import { rgba, TRANSPARENT } from "@/domain/canvas/PixelColor";
import { cropPixelGridToOpaqueBounds } from "./PatternBrushCrop";

describe("cropPixelGridToOpaqueBounds", () => {
  it("returns null for fully transparent grid", () => {
    const grid = PixelGrid.createEmpty(4, 4);
    expect(cropPixelGridToOpaqueBounds(grid)).toBeNull();
  });

  it("returns same grid when already tight", () => {
    const grid = PixelGrid.createEmpty(2, 2);
    grid.setPixel(0, 0, rgba(255, 0, 0));
    grid.setPixel(1, 1, rgba(0, 255, 0));
    expect(cropPixelGridToOpaqueBounds(grid)).toBe(grid);
  });

  it("trims transparent outer padding", () => {
    const grid = PixelGrid.createEmpty(5, 5);
    grid.setPixel(2, 2, rgba(255, 0, 0, 255));

    const cropped = cropPixelGridToOpaqueBounds(grid);
    expect(cropped).not.toBeNull();
    expect(cropped!.width).toBe(1);
    expect(cropped!.height).toBe(1);
    expect(cropped!.getPixel(0, 0)).toBe(rgba(255, 0, 0, 255));
  });

  it("preserves partial transparency inside bounds", () => {
    const grid = PixelGrid.createEmpty(3, 3);
    grid.setPixel(1, 1, rgba(255, 0, 0, 128));
    const cropped = cropPixelGridToOpaqueBounds(grid);
    expect(cropped!.getPixel(0, 0)).toBe(rgba(255, 0, 0, 128));
    expect(cropped!.getPixel(0, 1)).toBe(TRANSPARENT);
  });
});
