import { describe, expect, it } from "vitest";
import {
  resolveShapeDragCorners,
  shapeDragBoundingPoints,
  shapeDragPreviewRect,
} from "./ShapeDragGeometry";

describe("ShapeDragGeometry", () => {
  it("returns origin and pointer unchanged without alt", () => {
    const result = resolveShapeDragCorners(
      { x: 2, y: 3 },
      { x: 8, y: 9 },
      "rectangle",
      { altKey: false },
    );
    expect(result).toEqual({ from: { x: 2, y: 3 }, to: { x: 8, y: 9 } });
  });

  it("expands rectangle drag symmetrically from center with alt", () => {
    const result = resolveShapeDragCorners(
      { x: 5, y: 5 },
      { x: 8, y: 7 },
      "rectangle",
      { altKey: true },
    );
    expect(result).toEqual({ from: { x: 2, y: 3 }, to: { x: 8, y: 7 } });
  });

  it("expands ellipse drag symmetrically from center with alt", () => {
    const result = resolveShapeDragCorners(
      { x: 10, y: 10 },
      { x: 6, y: 12 },
      "ellipse",
      { altKey: true },
    );
    expect(result).toEqual({ from: { x: 6, y: 8 }, to: { x: 14, y: 12 } });
  });

  it("ignores alt for line mode", () => {
    const result = resolveShapeDragCorners(
      { x: 1, y: 1 },
      { x: 4, y: 6 },
      "line",
      { altKey: true },
    );
    expect(result).toEqual({ from: { x: 1, y: 1 }, to: { x: 4, y: 6 } });
  });

  it("computes bounding points for layer expansion", () => {
    const points = shapeDragBoundingPoints(
      { x: 5, y: 5 },
      { x: 8, y: 7 },
      "rectangle",
      { altKey: true },
    );
    expect(points).toEqual([
      { x: 2, y: 3 },
      { x: 8, y: 7 },
    ]);
  });

  it("computes preview rect with pixel-inclusive dimensions", () => {
    const rect = shapeDragPreviewRect(
      { x: 5, y: 5 },
      { x: 8, y: 7 },
      "rectangle",
      { altKey: true },
    );
    expect(rect).toEqual({ x: 2, y: 3, width: 7, height: 5 });
  });
});
