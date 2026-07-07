import { describe, expect, it } from "vitest";
import { PixelGrid } from "@/domain/canvas/PixelGrid";
import { rgba } from "@/domain/canvas/PixelColor";
import { paintBrushAt, paintBrushSegment } from "@/domain/tool/BrushStroke";
import type { ToolContext } from "@/domain/tool/ITool";
import { DEFAULT_TOOL_SETTINGS } from "@/domain/tool/ToolType";
import { PixelPerfectStrokeSession } from "@/domain/tool/PixelPerfectStroke";

function createBrushContext(
  grid: PixelGrid,
  overrides: Partial<ToolContext["settings"]> = {},
): ToolContext {
  return {
    grid,
    color: rgba(255, 0, 0),
    settings: {
      ...DEFAULT_TOOL_SETTINGS,
      brushPerfectPixel: true,
      ...overrides,
    },
    modifiers: { shiftKey: false, altKey: false },
    selectionMask: null,
    patternStamp: null,
  };
}

describe("paintBrushSegment", () => {
  it("applies pixel-perfect corner culling for a 1px brush", () => {
    const grid = PixelGrid.createEmpty(4, 4);
    const session = new PixelPerfectStrokeSession();
    const ctx = createBrushContext(grid, { brushSize: 1 });

    paintBrushAt(ctx, { x: 0, y: 0 }, session);
    paintBrushSegment(ctx, { x: 0, y: 0 }, { x: 1, y: 0 }, session);
    paintBrushSegment(ctx, { x: 1, y: 0 }, { x: 1, y: 1 }, session);

    expect(grid.getPixel(1, 0)).toBe(0);
    expect(grid.getPixel(0, 0)).toBe(ctx.color);
    expect(grid.getPixel(1, 1)).toBe(ctx.color);
  });

  it("does not apply pixel-perfect culling for thicker brushes", () => {
    const grid = PixelGrid.createEmpty(5, 5);
    const session = new PixelPerfectStrokeSession();
    const ctx = createBrushContext(grid, { brushSize: 2 });

    paintBrushAt(ctx, { x: 1, y: 1 }, session);
    paintBrushSegment(ctx, { x: 1, y: 1 }, { x: 2, y: 1 }, session);
    paintBrushSegment(ctx, { x: 2, y: 1 }, { x: 2, y: 2 }, session);

    expect(grid.getPixel(2, 1)).toBe(ctx.color);
  });
});
