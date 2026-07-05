import { describe, expect, it } from "vitest";
import {
  canvasResizeDeltaFromDrag,
  resizeCanvasFromEdge,
  snapCanvasResizeDelta,
} from "./CanvasEdgeResizeOperations";

describe("CanvasEdgeResizeOperations", () => {
  it("expands width from right edge", () => {
    expect(resizeCanvasFromEdge({ width: 64, height: 32 }, "right", 32)).toEqual({
      width: 96,
      height: 32,
    });
  });

  it("expands height from bottom edge", () => {
    expect(resizeCanvasFromEdge({ width: 64, height: 32 }, "bottom", 32)).toEqual({
      width: 64,
      height: 64,
    });
  });

  it("shrinks without going below minimum dimension", () => {
    expect(resizeCanvasFromEdge({ width: 16, height: 8 }, "right", -32)).toEqual({
      width: 1,
      height: 8,
    });
    expect(resizeCanvasFromEdge({ width: 16, height: 8 }, "bottom", -32)).toEqual({
      width: 16,
      height: 1,
    });
  });

  it("clamps to maximum dimension", () => {
    expect(resizeCanvasFromEdge({ width: 4090, height: 64 }, "right", 32)).toEqual({
      width: 4096,
      height: 64,
    });
  });

  it("snaps drag delta to step when fixed step is enabled", () => {
    expect(snapCanvasResizeDelta(50, 32, true)).toBe(64);
    expect(snapCanvasResizeDelta(-50, 32, true)).toBe(-64);
    expect(snapCanvasResizeDelta(50, 32, false)).toBe(50);
  });

  it("converts screen drag distance to canvas pixels", () => {
    expect(canvasResizeDeltaFromDrag(64, 8)).toBe(8);
    expect(canvasResizeDeltaFromDrag(-32, 4)).toBe(-8);
    expect(canvasResizeDeltaFromDrag(10, 0)).toBe(0);
  });
});
