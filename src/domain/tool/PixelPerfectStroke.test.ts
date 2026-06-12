import { describe, expect, it } from "vitest";
import { PixelGrid } from "@/domain/canvas/PixelGrid";
import { rgba } from "@/domain/canvas/PixelColor";
import {
  isRedundantCorner,
  PixelPerfectStrokeSession,
} from "@/domain/tool/PixelPerfectStroke";

describe("isRedundantCorner", () => {
  it("detects an L-shaped corner pixel", () => {
    expect(isRedundantCorner({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 })).toBe(true);
    expect(isRedundantCorner({ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 })).toBe(true);
  });

  it("does not flag straight or diagonal continuations", () => {
    expect(isRedundantCorner({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 })).toBe(false);
    expect(isRedundantCorner({ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 2 })).toBe(false);
  });
});

describe("PixelPerfectStrokeSession", () => {
  it("restores the original color when removing an L corner", () => {
    const grid = PixelGrid.createEmpty(4, 4);
    const background = rgba(0, 0, 255);
    grid.setPixel(1, 0, background);

    const session = new PixelPerfectStrokeSession();
    const strokeColor = rgba(255, 0, 0);

    session.commitPixel(grid, { x: 0, y: 0 }, strokeColor);
    session.commitPixel(grid, { x: 1, y: 0 }, strokeColor);
    session.tryRemoveCorner(grid, { x: 1, y: 1 });
    session.commitPixel(grid, { x: 1, y: 1 }, strokeColor);

    expect(grid.getPixel(1, 0)).toBe(background);
    expect(grid.getPixel(0, 0)).toBe(strokeColor);
    expect(grid.getPixel(1, 1)).toBe(strokeColor);
    expect(session.centers).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 1 },
    ]);
  });

  it("does not remove pixels on non-L turns", () => {
    const grid = PixelGrid.createEmpty(4, 4);
    const session = new PixelPerfectStrokeSession();
    const strokeColor = rgba(255, 0, 0);

    session.commitPixel(grid, { x: 0, y: 0 }, strokeColor);
    session.commitPixel(grid, { x: 1, y: 0 }, strokeColor);
    session.tryRemoveCorner(grid, { x: 2, y: 0 });
    session.commitPixel(grid, { x: 2, y: 0 }, strokeColor);

    expect(grid.getPixel(1, 0)).toBe(strokeColor);
    expect(session.centers).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
    ]);
  });

  it("clears state on reset", () => {
    const grid = PixelGrid.createEmpty(2, 2);
    const session = new PixelPerfectStrokeSession();

    session.commitPixel(grid, { x: 0, y: 0 }, rgba(255, 0, 0));
    session.reset();

    expect(session.centers).toEqual([]);
  });
});
