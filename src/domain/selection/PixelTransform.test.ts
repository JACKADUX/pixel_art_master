import { describe, expect, it } from "vitest";
import { PixelGrid } from "@/domain/canvas/PixelGrid";
import { rgba } from "@/domain/canvas/PixelColor";
import { rotateGrid90 } from "@/domain/selection/PixelTransform";

describe("PixelTransform", () => {
  it("rotates grids by 90 degrees", () => {
    const grid = PixelGrid.createEmpty(2, 3);
    const red = rgba(255, 0, 0);
    grid.setPixel(0, 0, red);

    const rotated = rotateGrid90(grid, 1);
    expect(rotated.width).toBe(3);
    expect(rotated.height).toBe(2);
    expect(rotated.getPixel(2, 0)).toBe(red);
  });
});
