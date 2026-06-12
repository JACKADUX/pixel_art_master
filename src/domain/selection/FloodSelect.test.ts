import { describe, expect, it } from "vitest";
import { PixelGrid } from "@/domain/canvas/PixelGrid";
import { rgba } from "@/domain/canvas/PixelColor";
import { floodSelectMask } from "@/domain/selection/FloodSelect";
import { isMaskSelected } from "@/domain/selection/SelectionMask";

describe("FloodSelect", () => {
  it("selects contiguous pixels with zero tolerance", () => {
    const grid = PixelGrid.createEmpty(4, 4);
    grid.setPixel(1, 1, rgba(255, 0, 0));
    grid.setPixel(2, 1, rgba(255, 0, 0));
    grid.setPixel(3, 3, rgba(0, 255, 0));

    const mask = floodSelectMask(grid, { x: 1, y: 1 }, {
      tolerance: 0,
      contiguous: true,
    });

    expect(isMaskSelected(mask, 1, 1)).toBe(true);
    expect(isMaskSelected(mask, 2, 1)).toBe(true);
    expect(isMaskSelected(mask, 3, 3)).toBe(false);
  });
});
