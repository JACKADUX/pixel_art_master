import { describe, expect, it, vi } from "vitest";
import { applyGridRestoreToGrid } from "@/domain/pixelRestore/GridRestoreOperations";

vi.mock("@/infrastructure/image/PixelGridCodec", () => ({
  pixelGridToImageData: (grid: { width: number; height: number; toRgba: () => Uint8ClampedArray }) =>
    ({ width: grid.width, height: grid.height, data: grid.toRgba() }) as ImageData,
}));

describe("GridRestoreUseCases", () => {
  it("applies grid restore and returns downscaled grid", () => {
    const width = 40;
    const height = 20;
    const data = new Uint8ClampedArray(width * height * 4);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const offset = (y * width + x) * 4;
        const red = x % 20 === 0 && y % 10 === 0;
        data[offset] = red ? 255 : 0;
        data[offset + 1] = red ? 0 : 255;
        data[offset + 2] = 0;
        data[offset + 3] = 255;
      }
    }

    const { grid, layout } = applyGridRestoreToGrid(
      data,
      { width, height },
      { x: 0, y: 0, width: 10, height: 10 },
      "topLeft",
    );

    expect(layout.outputWidth).toBe(4);
    expect(layout.outputHeight).toBe(2);
    expect(grid.getPixel(0, 0) & 0xff).toBe(255);
  });

  it("merges cells with median algorithm", () => {
    const data = new Uint8ClampedArray([
      0, 0, 0, 255, 100, 0, 0, 255,
      0, 0, 0, 255, 100, 0, 0, 255,
    ]);
    const { grid } = applyGridRestoreToGrid(
      data,
      { width: 2, height: 2 },
      { x: 0, y: 0, width: 2, height: 2 },
      "median",
    );
    expect(grid.width).toBe(1);
    expect(grid.height).toBe(1);
    expect(grid.getPixel(0, 0) & 0xff).toBe(50);
  });
});
