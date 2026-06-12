import { describe, expect, it } from "vitest";
import { PixelGrid } from "@/domain/canvas/PixelGrid";
import { rgba } from "@/domain/canvas/PixelColor";
import { wrapWithMask } from "@/domain/canvas/MaskedPixelGrid";
import { createEmptyMask, setMaskPixel } from "@/domain/selection/SelectionMask";

describe("MaskedPixelGrid", () => {
  it("blocks setPixel outside mask", () => {
    const grid = PixelGrid.createEmpty(4, 4);
    const mask = createEmptyMask(4, 4);
    setMaskPixel(mask, 1, 1, true);

    const masked = wrapWithMask(grid, mask);
    masked.setPixel(1, 1, rgba(255, 0, 0));
    masked.setPixel(2, 2, rgba(0, 255, 0));

    expect(grid.getPixel(1, 1)).toBe(rgba(255, 0, 0));
    expect(grid.getPixel(2, 2)).toBe(0);
  });
});
