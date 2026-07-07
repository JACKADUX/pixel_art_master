import { describe, expect, it } from "vitest";
import { PixelGrid } from "@/domain/canvas/PixelGrid";
import { rgba } from "@/domain/canvas/PixelColor";
import {
  createTileCellMask,
  createTileUnionMask,
  forEachTileReplicatedPoint,
  regionHasVisiblePixels,
  replicateTilePatternFromRegion,
} from "./TileReplication";
import {
  findTileCellAt,
  getTileCell,
  getAllTileCells,
  toLocalCoord,
} from "./TileRegion";

describe("TileRegion", () => {
  const region = { x: 10, y: 10, width: 4, height: 3 };

  it("returns 9 tile cells around center", () => {
    expect(getAllTileCells(region)).toHaveLength(9);
    expect(getTileCell(region, 0, 0)).toEqual(region);
    expect(getTileCell(region, -1, 0)).toEqual({ x: 6, y: 10, width: 4, height: 3 });
    expect(getTileCell(region, 1, 1)).toEqual({ x: 14, y: 13, width: 4, height: 3 });
  });

  it("finds tile cell for points in 3x3 union", () => {
    expect(findTileCellAt(11, 11, region)).toEqual({ col: 0, row: 0 });
    expect(findTileCellAt(7, 11, region)).toEqual({ col: -1, row: 0 });
    expect(findTileCellAt(15, 14, region)).toEqual({ col: 1, row: 1 });
    expect(findTileCellAt(5, 5, region)).toBeNull();
  });

  it("maps world coords to local coords within tile", () => {
    expect(toLocalCoord(11, 12, region)).toEqual({ lx: 1, ly: 2 });
    expect(toLocalCoord(7, 12, region)).toEqual({ lx: 1, ly: 2 });
  });
});

describe("TileReplication", () => {
  const region = { x: 10, y: 10, width: 4, height: 3 };

  it("replicates a point to all 9 tile positions", () => {
    const points: string[] = [];
    forEachTileReplicatedPoint(11, 11, region, (wx, wy) => {
      points.push(`${wx},${wy}`);
    });
    expect(points).toHaveLength(9);
    expect(points).toContain("11,11");
    expect(points).toContain("7,11");
    expect(points).toContain("15,14");
  });

  it("does not replicate points outside the 9-tile union", () => {
    const points: string[] = [];
    forEachTileReplicatedPoint(0, 0, region, (wx, wy) => {
      points.push(`${wx},${wy}`);
    });
    expect(points).toHaveLength(0);
  });

  it("creates union mask covering 9 cells", () => {
    const mask = createTileUnionMask(region, 32, 32);
    expect(mask.data[10 * 32 + 10]).toBe(255);
    expect(mask.data[10 * 32 + 6]).toBe(255);
    expect(mask.data[13 * 32 + 14]).toBe(255);
    expect(mask.data[5 * 32 + 5]).toBe(0);
  });

  it("creates single-cell mask for fill", () => {
    const mask = createTileCellMask(7, 11, region, 32, 32);
    expect(mask).not.toBeNull();
    expect(mask!.data[11 * 32 + 7]).toBe(255);
    expect(mask!.data[11 * 32 + 11]).toBe(0);
  });

  it("writes replicated pixels through tiled surface integration", () => {
    const grid = PixelGrid.createEmpty(32, 32);
    const color = rgba(255, 0, 0, 255);
    forEachTileReplicatedPoint(11, 11, region, (wx, wy) => {
      if (grid.inBounds(wx, wy)) grid.setPixel(wx, wy, color);
    });
    expect(grid.getPixel(11, 11)).toBe(color);
    expect(grid.getPixel(7, 11)).toBe(color);
    expect(grid.getPixel(15, 14)).toBe(color);
    expect(grid.getPixel(0, 0)).toBe(0);
  });

  it("detects visible pixels in region", () => {
    const grid = PixelGrid.createEmpty(32, 32);
    expect(regionHasVisiblePixels(grid, region)).toBe(false);

    grid.setPixel(11, 11, rgba(255, 0, 0, 255));
    expect(regionHasVisiblePixels(grid, region)).toBe(true);
  });

  it("replicates existing region pixels to all tile cells", () => {
    const grid = PixelGrid.createEmpty(32, 32);
    const red = rgba(255, 0, 0, 255);
    const blue = rgba(0, 0, 255, 255);

    grid.setPixel(11, 11, red);
    grid.setPixel(12, 11, blue);

    replicateTilePatternFromRegion(grid, region);

    expect(grid.getPixel(11, 11)).toBe(red);
    expect(grid.getPixel(12, 11)).toBe(blue);
    expect(grid.getPixel(7, 11)).toBe(red);
    expect(grid.getPixel(8, 11)).toBe(blue);
    expect(grid.getPixel(15, 14)).toBe(red);
    expect(grid.getPixel(16, 14)).toBe(blue);
  });
});
