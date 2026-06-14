import { describe, expect, it } from "vitest";
import {
  adjustCaptureRectBottomRight,
  adjustCaptureRectTopLeft,
  clampCaptureRectToBounds,
} from "./AssetCaptureRect";

describe("clampCaptureRectToBounds", () => {
  it("clamps position and size within canvas", () => {
    const rect = { x: -2, y: 5, width: 100, height: 50 };
    const result = clampCaptureRectToBounds(rect, 32, 32);
    expect(result).toEqual({ x: 0, y: 5, width: 32, height: 27 });
  });

  it("enforces minimum 1px size", () => {
    const rect = { x: 10, y: 10, width: 0, height: 0 };
    const result = clampCaptureRectToBounds(rect, 32, 32);
    expect(result.width).toBe(1);
    expect(result.height).toBe(1);
  });
});

describe("adjustCaptureRectTopLeft", () => {
  it("moves top-left corner and preserves bottom-right", () => {
    const rect = { x: 5, y: 5, width: 10, height: 8 };
    const result = adjustCaptureRectTopLeft(rect, 2, 1, 32, 32);
    expect(result).toEqual({ x: 7, y: 6, width: 8, height: 7 });
  });

  it("does not cross bottom-right corner", () => {
    const rect = { x: 5, y: 5, width: 10, height: 8 };
    const result = adjustCaptureRectTopLeft(rect, 20, 20, 32, 32);
    expect(result.x).toBeLessThanOrEqual(14);
    expect(result.y).toBeLessThanOrEqual(12);
    expect(result.width).toBeGreaterThanOrEqual(1);
    expect(result.height).toBeGreaterThanOrEqual(1);
  });
});

describe("adjustCaptureRectBottomRight", () => {
  it("expands bottom-right corner", () => {
    const rect = { x: 5, y: 5, width: 10, height: 8 };
    const result = adjustCaptureRectBottomRight(rect, 2, 3, 32, 32);
    expect(result).toEqual({ x: 5, y: 5, width: 12, height: 11 });
  });

  it("clamps to canvas bounds", () => {
    const rect = { x: 28, y: 28, width: 4, height: 4 };
    const result = adjustCaptureRectBottomRight(rect, 10, 10, 32, 32);
    expect(result.width).toBe(4);
    expect(result.height).toBe(4);
  });
});
