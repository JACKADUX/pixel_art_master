import { describe, expect, it } from "vitest";
import { PixelGrid } from "@/domain/canvas/PixelGrid";
import { rgba } from "@/domain/canvas/PixelColor";
import { createSelectionState } from "@/domain/selection/SelectionState";
import { createRectMask } from "@/domain/selection/SelectionMaskOperations";
import {
  extractPatternBrushPixelsFromSelection,
  resolvePatternBrushSelectionState,
} from "./ResolvePatternBrushSelection";

describe("ResolvePatternBrushSelection", () => {
  it("resolves committed rectangle selection", () => {
    const mask = createRectMask({ x: 1, y: 1 }, { x: 3, y: 3 }, 8, 8);
    const selection = createSelectionState(mask);

    const resolved = resolvePatternBrushSelectionState({
      selection,
      selectionDrag: null,
      lassoPoints: [],
      toolSettings: { selectionMode: "rectangle" },
      canvasWidth: 8,
      canvasHeight: 8,
    });

    expect(resolved).not.toBeNull();
    expect(resolved!.bounds.width).toBeGreaterThan(0);
  });

  it("resolves pending create drag when selection is not committed yet", () => {
    const resolved = resolvePatternBrushSelectionState({
      selection: null,
      selectionDrag: {
        start: { x: 1, y: 1 },
        current: { x: 4, y: 4 },
        mode: "create",
      },
      lassoPoints: [],
      toolSettings: { selectionMode: "rectangle" },
      canvasWidth: 8,
      canvasHeight: 8,
    });

    expect(resolved).not.toBeNull();
    expect(resolved!.bounds.width).toBeGreaterThan(0);
  });

  it("extracts pixels from floating selection", () => {
    const grid = PixelGrid.createEmpty(4, 4);
    grid.setPixel(1, 1, rgba(255, 0, 0, 255));

    const mask = createRectMask({ x: 1, y: 1 }, { x: 1, y: 1 }, 4, 4);
    const selection = createSelectionState(mask);
    const floating = {
      pixels: PixelGrid.createEmpty(1, 1),
      offset: { x: 1, y: 1 },
      originInLayer: { x: 1, y: 1 },
      source: "layer" as const,
    };
    floating.pixels.setPixel(0, 0, rgba(255, 0, 0, 255));

    const pixels = extractPatternBrushPixelsFromSelection(grid, {
      ...selection,
      floating,
      mask: createRectMask({ x: 0, y: 0 }, { x: 0, y: 0 }, 4, 4),
    });

    expect(pixels?.width).toBe(1);
    expect(pixels?.getPixel(0, 0)).toBe(rgba(255, 0, 0, 255));
  });
});
