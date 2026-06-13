import { describe, expect, it } from "vitest";
import {
  computeRelativeOffsetWithinSecondaryGrid,
  computeSecondaryGridCellOrigin,
  formatGridRelativePosition,
} from "@/domain/grid/GridRelativePosition";

describe("computeSecondaryGridCellOrigin", () => {
  const secondary = 8;

  it("maps pixels to their secondary grid cell origin", () => {
    expect(computeSecondaryGridCellOrigin(0, 0, secondary)).toEqual({ x: 0, y: 0 });
    expect(computeSecondaryGridCellOrigin(7, 7, secondary)).toEqual({ x: 0, y: 0 });
    expect(computeSecondaryGridCellOrigin(8, 0, secondary)).toEqual({ x: 8, y: 0 });
    expect(computeSecondaryGridCellOrigin(10, 15, secondary)).toEqual({ x: 8, y: 8 });
  });
});

describe("computeRelativeOffsetWithinSecondaryGrid", () => {
  const secondary = 8;

  it("maps origin pixel to (1, 1)", () => {
    expect(computeRelativeOffsetWithinSecondaryGrid(0, 0, secondary)).toEqual({ x: 1, y: 1 });
  });

  it("maps last cell pixel to (8, 8)", () => {
    expect(computeRelativeOffsetWithinSecondaryGrid(7, 7, secondary)).toEqual({ x: 8, y: 8 });
  });

  it("wraps at secondary boundary", () => {
    expect(computeRelativeOffsetWithinSecondaryGrid(8, 0, secondary)).toEqual({ x: 1, y: 1 });
    expect(computeRelativeOffsetWithinSecondaryGrid(10, 15, secondary)).toEqual({ x: 3, y: 8 });
  });

  it("handles negative pixel coordinates", () => {
    expect(computeRelativeOffsetWithinSecondaryGrid(-1, -1, secondary)).toEqual({ x: 8, y: 8 });
    expect(computeRelativeOffsetWithinSecondaryGrid(-8, -8, secondary)).toEqual({ x: 1, y: 1 });
  });

  it("clamps invalid secondary size to 1", () => {
    expect(computeRelativeOffsetWithinSecondaryGrid(3, 5, 0)).toEqual({ x: 1, y: 1 });
  });
});

describe("formatGridRelativePosition", () => {
  it("formats offset as parenthesized pair", () => {
    expect(formatGridRelativePosition({ x: 3, y: 8 })).toBe("(3, 8)");
  });
});
