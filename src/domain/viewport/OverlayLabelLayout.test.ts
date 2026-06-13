import { describe, expect, it } from "vitest";
import {
  computeGridRelativeLabelPosition,
  computeGridRelativeLabelScreenPosition,
  computeSecondaryGridCellScreenBounds,
} from "@/domain/viewport/OverlayLabelLayout";

describe("computeGridRelativeLabelPosition", () => {
  it("aligns label origin with the grid cell start point", () => {
    expect(computeGridRelativeLabelPosition({ x: 8, y: 8 }, 8, 8)).toEqual({
      left: 64,
      top: 64,
    });
  });
});

describe("computeGridRelativeLabelScreenPosition", () => {
  it("offsets canvas-local label position by canvas rect", () => {
    expect(
      computeGridRelativeLabelScreenPosition(
        { left: 100, top: 50 },
        { x: 0, y: 0 },
        8,
        8,
      ),
    ).toEqual({
      left: 100,
      top: 50,
    });
  });
});

describe("computeSecondaryGridCellScreenBounds", () => {
  it("returns screen bounds for the secondary grid cell", () => {
    expect(
      computeSecondaryGridCellScreenBounds(
        { left: 100, top: 50 },
        { x: 8, y: 8 },
        8,
        8,
      ),
    ).toEqual({
      left: 164,
      top: 114,
      width: 64,
      height: 64,
    });
  });
});
