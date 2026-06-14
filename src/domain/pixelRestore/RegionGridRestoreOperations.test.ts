import { describe, expect, it } from "vitest";
import { rgba } from "@/domain/canvas/PixelColor";
import {
  applyRegionGridRestoreToGrid,
  clampGridCount,
  computeExpandedGridBounds,
  computeRegionGridLayout,
  getRegionCellRect,
  getRegionTotalGridCounts,
  isOuterRegionGridCell,
} from "./RegionGridRestoreOperations";

describe("RegionGridRestoreOperations", () => {
  const innerRegion = { x: 10, y: 5, width: 100, height: 60 };

  it("expands grid bounds by one cell ring", () => {
    const bounds = computeExpandedGridBounds(innerRegion, 5, 3);
    const { totalColumns, totalRows } = getRegionTotalGridCounts(5, 3);

    expect(totalColumns).toBe(7);
    expect(totalRows).toBe(5);

    const innerCell = getRegionCellRect(innerRegion, 0, 0, 5, 3);
    const alignedCell = getRegionCellRect(bounds, 1, 1, totalColumns, totalRows);
    expect(alignedCell.x).toBe(innerCell.x);
    expect(alignedCell.y).toBe(innerCell.y);
    expect(alignedCell.width).toBe(innerCell.width);
    expect(alignedCell.height).toBe(innerCell.height);
  });

  it("computes layout with outer ring in output size", () => {
    const layout = computeRegionGridLayout(innerRegion, 5, 3);
    expect(layout).toMatchObject({
      innerRegion,
      columns: 5,
      rows: 3,
      totalColumns: 7,
      totalRows: 5,
      outputWidth: 7,
      outputHeight: 5,
    });
  });

  it("clamps inner grid counts to region size", () => {
    expect(clampGridCount(200, 100)).toBe(100);
    expect(clampGridCount(0, 50)).toBe(1);
    const layout = computeRegionGridLayout(innerRegion, 999, 999);
    expect(layout?.columns).toBe(100);
    expect(layout?.rows).toBe(60);
    expect(layout?.outputWidth).toBe(102);
    expect(layout?.outputHeight).toBe(62);
  });

  it("marks outer ring cells", () => {
    expect(isOuterRegionGridCell(0, 0, 7, 5)).toBe(true);
    expect(isOuterRegionGridCell(1, 1, 7, 5)).toBe(false);
    expect(isOuterRegionGridCell(6, 4, 7, 5)).toBe(true);
  });

  it("produces output grid including outer ring", () => {
    const width = 200;
    const height = 120;
    const data = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255;
      data[i + 3] = 255;
    }

    const { grid, layout } = applyRegionGridRestoreToGrid(
      data,
      { width, height },
      innerRegion,
      5,
      3,
      "topLeft",
    );

    expect(layout.outputWidth).toBe(7);
    expect(layout.outputHeight).toBe(5);
    expect(grid.width).toBe(7);
    expect(grid.height).toBe(5);
    expect(grid.getPixel(0, 0) & 0xff).toBe(255);
    expect(grid.getPixel(6, 4) & 0xff).toBe(255);
  });

  it("merges cell colors within region", () => {
    const data = new Uint8ClampedArray([
      0, 0, 0, 255, 100, 0, 0, 255,
      0, 0, 0, 255, 100, 0, 0, 255,
    ]);
    const { grid } = applyRegionGridRestoreToGrid(
      data,
      { width: 2, height: 2 },
      { x: 0, y: 0, width: 2, height: 2 },
      1,
      1,
      "median",
    );
    expect(grid.width).toBe(3);
    expect(grid.height).toBe(3);
    expect(grid.getPixel(1, 1) & 0xff).toBe(50);
    expect(grid.getPixel(1, 1)).toBe(rgba(50, 0, 0, 255));
  });
});
