import { describe, expect, it } from "vitest";
import { adjustSeedBottomRight, adjustSeedTopLeft, hitTestSeedCornerHandle, resizeSeedFromCornerHandle } from "./GridCellOperations";
import { mergeCellColors } from "./GridMergeOperations";
import { rgba } from "@/domain/canvas/PixelColor";
import {
  applyGridRestoreToGrid,
  collectCellColors,
  computeGridLayout,
  computeGridOverlayLineIndices,
  intersectCellWithImage,
  validateGridRestore,
} from "./GridRestoreOperations";

describe("GridRestoreOperations", () => {
  const imageSize = { width: 100, height: 80 };

  it("computes full grid layout including regions left and above seed", () => {
    const layout = computeGridLayout(imageSize, { x: 10, y: 5, width: 20, height: 10 });
    expect(layout).toEqual({
      seedCell: { x: 10, y: 5, width: 20, height: 10 },
      columnStart: -1,
      rowStart: -1,
      columns: 6,
      rows: 9,
      outputWidth: 6,
      outputHeight: 9,
    });
  });

  it("includes partial cells at all image edges", () => {
    const layout = computeGridLayout(imageSize, { x: 0, y: 0, width: 30, height: 30 });
    expect(layout?.columns).toBe(4);
    expect(layout?.rows).toBe(3);
  });

  it("returns null for invalid seed dimensions", () => {
    expect(computeGridLayout(imageSize, { x: 0, y: 0, width: 0, height: 10 })).toBeNull();
  });

  it("merges only pixels inside image for partial edge cells", () => {
    const width = 10;
    const height = 10;
    const data = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255;
      data[i + 1] = 0;
      data[i + 2] = 0;
      data[i + 3] = 255;
    }

    const { grid, layout } = applyGridRestoreToGrid(
      data,
      { width, height },
      { x: 5, y: 0, width: 5, height: 5 },
      "topLeft",
    );

    expect(layout.columnStart).toBe(-1);
    expect(layout.columns).toBe(2);
    const partialCell = intersectCellWithImage(
      {
        x: 0,
        y: 0,
        width: 5,
        height: 5,
        column: -1,
        row: 0,
      },
      { width, height },
    );
    expect(partialCell).toEqual({ x: 0, y: 0, width: 5, height: 5, column: -1, row: 0 });
    expect(grid.width).toBe(2);
    expect(grid.height).toBe(2);
  });

  it("includes overlay line indices for regions above and left of seed", () => {
    expect(computeGridOverlayLineIndices(10, 20, 100)).toEqual([-1, 0, 1, 2, 3, 4, 5]);
    expect(computeGridOverlayLineIndices(0, 20, 100)).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it("throws for invalid grid seed", () => {
    expect(() =>
      validateGridRestore(imageSize, { x: 0, y: 0, width: 0, height: 10 }),
    ).toThrow(/Invalid grid seed/);
  });

  it("uses center priority to ignore edge noise when merging", () => {
    const width = 5;
    const height = 5;
    const data = new Uint8ClampedArray(width * height * 4);
    const centerColor = rgba(0, 128, 255, 255);
    const edgeColor = rgba(255, 0, 0, 255);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const isCenter = x === 2 && y === 2;
        const color = isCenter ? centerColor : edgeColor;
        const offset = (y * width + x) * 4;
        data[offset] = color & 0xff;
        data[offset + 1] = (color >> 8) & 0xff;
        data[offset + 2] = (color >> 16) & 0xff;
        data[offset + 3] = (color >> 24) & 0xff;
      }
    }

    const cell = { x: 0, y: 0, width: 5, height: 5, column: 0, row: 0 };
    const allColors = collectCellColors(data, width, cell);
    expect(mergeCellColors(allColors, "median")).toBe(edgeColor);

    const centerColors = collectCellColors(data, width, cell, {
      enabled: true,
      excludeRingCount: 2,
    });
    expect(centerColors).toHaveLength(1);
    expect(mergeCellColors(centerColors, "median")).toBe(centerColor);

    const { grid } = applyGridRestoreToGrid(
      data,
      { width, height },
      { x: 0, y: 0, width: 5, height: 5 },
      "median",
      { enabled: true, excludeRingCount: 2 },
    );
    expect(grid.getPixel(0, 0)).toBe(centerColor);
  });
});

describe("GridMergeOperations", () => {
  it("uses top-left pixel", () => {
    const colors = [rgba(255, 0, 0), rgba(0, 255, 0)];
    expect(mergeCellColors(colors, "topLeft")).toBe(colors[0]);
  });

  it("computes average color", () => {
    const colors = [rgba(0, 0, 0), rgba(100, 200, 50, 255)];
    expect(mergeCellColors(colors, "average")).toBe(rgba(50, 100, 25, 255));
  });

  it("computes median per channel", () => {
    const colors = [rgba(0, 0, 0), rgba(100, 200, 50, 255), rgba(200, 100, 150, 128)];
    expect(mergeCellColors(colors, "median")).toBe(rgba(100, 100, 50, 255));
  });

  it("computes mode color", () => {
    const red = rgba(255, 0, 0);
    const green = rgba(0, 255, 0);
    const colors = [red, green, red, red];
    expect(mergeCellColors(colors, "mode")).toBe(red);
  });
});

describe("GridCellOperations", () => {
  const imageSize = { width: 100, height: 80 };
  const seed = { x: 10, y: 10, width: 20, height: 15 };

  it("adjusts top-left within bounds", () => {
    const next = adjustSeedTopLeft(seed, -5, -3, imageSize);
    expect(next).toEqual({ x: 5, y: 7, width: 25, height: 18 });
  });

  it("adjusts bottom-right within bounds", () => {
    const next = adjustSeedBottomRight(seed, 2, 1, imageSize);
    expect(next).toEqual({ x: 10, y: 10, width: 22, height: 16 });
  });

  it("detects top-left and bottom-right corner handles", () => {
    expect(hitTestSeedCornerHandle({ x: 10, y: 10 }, seed, 1)).toBe("topLeft");
    expect(hitTestSeedCornerHandle({ x: 30, y: 25 }, seed, 1)).toBe("bottomRight");
    expect(hitTestSeedCornerHandle({ x: 20, y: 17 }, seed, 1)).toBeNull();
  });

  it("resizes seed from corner handle", () => {
    expect(resizeSeedFromCornerHandle(seed, "topLeft", { x: 8, y: 9 }, imageSize)).toEqual({
      x: 8,
      y: 9,
      width: 22,
      height: 16,
    });
    expect(resizeSeedFromCornerHandle(seed, "bottomRight", { x: 32, y: 27 }, imageSize)).toEqual({
      x: 10,
      y: 10,
      width: 22,
      height: 17,
    });
  });
});
