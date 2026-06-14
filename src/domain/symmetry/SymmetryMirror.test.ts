import { describe, expect, it } from "vitest";
import { PixelGrid } from "@/domain/canvas/PixelGrid";
import { wrapWithSymmetry } from "@/domain/canvas/SymmetricPixelSurface";
import { rgba } from "@/domain/canvas/PixelColor";
import { createDefaultSymmetryConfig } from "@/domain/symmetry/SymmetryConfig";
import {
  clampOriginToCanvas,
  forEachSymmetricPoint,
  mirrorPixelIndex,
  mirrorX,
  mirrorY,
  snapSymmetryOrigin,
  symmetryAxisCoord,
} from "@/domain/symmetry/SymmetryMirror";

describe("SymmetryMirror", () => {
  it("mirrors across a boundary axis (integer origin)", () => {
    expect(mirrorX(4, 5)).toBe(5);
    expect(mirrorX(5, 5)).toBe(4);
    expect(mirrorX(0, 5)).toBe(9);
    expect(mirrorX(9, 5)).toBe(0);
  });

  it("mirrors across a pixel-center axis (half-integer origin)", () => {
    expect(mirrorX(4, 4.5)).toBe(4);
    expect(mirrorX(3, 4.5)).toBe(5);
    expect(mirrorX(5, 4.5)).toBe(3);
  });

  it("boundary and center axes produce different mirrors", () => {
    expect(mirrorX(4, 5)).toBe(5);
    expect(mirrorX(4, 4.5)).toBe(4);
    expect(mirrorX(4, 5.5)).toBe(6);
    expect(mirrorX(5, 5.5)).toBe(5);
  });

  it("snaps symmetry origin to half-pixel grid", () => {
    expect(snapSymmetryOrigin(4.3)).toBe(4.5);
    expect(snapSymmetryOrigin(4.8)).toBe(5);
    expect(symmetryAxisCoord(5)).toBe(5);
    expect(symmetryAxisCoord(5.5)).toBe(5.5);
  });

  it("mirrors y across a centered horizontal axis", () => {
    expect(mirrorY(0, 5)).toBe(9);
    expect(mirrorY(9, 5)).toBe(0);
  });

  it("deduplicates points on the symmetry axis", () => {
    const points: string[] = [];
    forEachSymmetricPoint(
      5,
      5,
      { horizontal: true, vertical: true, originX: 5, originY: 5 },
      (x, y) => points.push(`${x},${y}`),
    );
    expect(points.sort()).toEqual(["4,4", "4,5", "5,4", "5,5"]);
  });

  it("produces four-way symmetry when both axes are enabled", () => {
    const points: string[] = [];
    forEachSymmetricPoint(
      1,
      2,
      { horizontal: true, vertical: true, originX: 5, originY: 5 },
      (x, y) => points.push(`${x},${y}`),
    );
    expect(points).toHaveLength(4);
    expect(points).toContain("1,2");
    expect(points).toContain("8,2");
    expect(points).toContain("1,7");
    expect(points).toContain("8,7");
  });

  it("supports half-pixel axis positions via mirrorPixelIndex", () => {
    expect(mirrorPixelIndex(3, 3.5)).toBe(3);
    expect(mirrorPixelIndex(2, 3.5)).toBe(4);
    expect(mirrorPixelIndex(4, 3.5)).toBe(2);
  });

  it("clamps origin to canvas bounds", () => {
    expect(clampOriginToCanvas({ originX: -2, originY: 99 }, 10, 10)).toEqual({
      originX: 0,
      originY: 9,
    });
  });
});

describe("SymmetricPixelSurface", () => {
  it("mirrors setPixel across a boundary axis on a 10x10 grid", () => {
    const grid = PixelGrid.createEmpty(10, 10);
    const config = {
      ...createDefaultSymmetryConfig(10, 10),
      horizontal: true,
      originX: 5,
      originY: 5,
    };
    const surface = wrapWithSymmetry(grid, config);
    const red = rgba(255, 0, 0);
    surface.setPixel(1, 5, red);

    expect(grid.getPixel(1, 5)).toBe(red);
    expect(grid.getPixel(8, 5)).toBe(red);
  });

  it("mirrors setPixel across a pixel-center axis on a 10x10 grid", () => {
    const grid = PixelGrid.createEmpty(10, 10);
    const config = {
      ...createDefaultSymmetryConfig(10, 10),
      horizontal: true,
      originX: 4.5,
      originY: 4.5,
    };
    const surface = wrapWithSymmetry(grid, config);
    const red = rgba(255, 0, 0);
    surface.setPixel(3, 5, red);

    expect(grid.getPixel(3, 5)).toBe(red);
    expect(grid.getPixel(5, 5)).toBe(red);
  });

  it("skips mirrored writes outside canvas bounds", () => {
    const grid = PixelGrid.createEmpty(3, 3);
    const config = {
      ...createDefaultSymmetryConfig(3, 3),
      horizontal: true,
      originX: 2,
      originY: 1,
    };
    const surface = wrapWithSymmetry(grid, config);
    const red = rgba(255, 0, 0);
    surface.setPixel(2, 0, red);

    expect(grid.getPixel(2, 0)).toBe(red);
    expect(grid.getPixel(1, 0)).toBe(red);
  });
});
