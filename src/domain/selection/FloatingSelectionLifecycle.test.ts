import { describe, expect, it } from "vitest";
import { PixelGrid } from "@/domain/canvas/PixelGrid";
import { rgba, TRANSPARENT } from "@/domain/canvas/PixelColor";
import {
  cancelFloating,
  commitFloating,
  invertFloatingSelection,
  syncMaskWithFloating,
} from "@/domain/selection/FloatingSelectionLifecycle";
import { createRectMask } from "@/domain/selection/SelectionMaskOperations";
import { isMaskSelected } from "@/domain/selection/SelectionMask";
import {
  createSelectionState,
  withFloating,
} from "@/domain/selection/SelectionState";

function createFloatingState(
  grid: PixelGrid,
  x: number,
  y: number,
  source: "layer" | "paste" | "cut" = "layer",
) {
  const pixels = PixelGrid.createEmpty(2, 2);
  pixels.setPixel(0, 0, rgba(255, 0, 0));
  pixels.setPixel(1, 1, rgba(0, 255, 0));
  const mask = createRectMask({ x, y }, { x: x + 1, y: y + 1 }, grid.width, grid.height);
  return withFloating(createSelectionState(mask), {
    pixels,
    offset: { x, y },
    originInLayer: { x, y },
    source,
  });
}

describe("FloatingSelectionLifecycle", () => {
  it("commit skips transparent pixels and preserves destination under holes", () => {
    const grid = PixelGrid.createEmpty(8, 8);
    grid.setPixel(3, 3, rgba(0, 0, 255));
    const pixels = PixelGrid.createEmpty(2, 2);
    pixels.setPixel(0, 0, rgba(255, 0, 0));
    const mask = createRectMask({ x: 2, y: 2 }, { x: 3, y: 3 }, 8, 8);
    const state = withFloating(createSelectionState(mask), {
      pixels,
      offset: { x: 2, y: 2 },
      originInLayer: { x: 2, y: 2 },
      source: "paste",
    });

    commitFloating(grid, state);

    expect(grid.getPixel(2, 2)).toBe(rgba(255, 0, 0));
    expect(grid.getPixel(3, 3)).toBe(rgba(0, 0, 255));
    expect(grid.getPixel(2, 3)).toBe(TRANSPARENT);
  });

  it("cancel paste does not write to grid", () => {
    const grid = PixelGrid.createEmpty(8, 8);
    grid.setPixel(2, 2, rgba(0, 0, 255));
    const state = createFloatingState(grid, 4, 4, "paste");

    cancelFloating(grid, state);

    expect(grid.getPixel(4, 4)).toBe(TRANSPARENT);
    expect(grid.getPixel(2, 2)).toBe(rgba(0, 0, 255));
  });

  it("cancel layer restores pixels to origin", () => {
    const grid = PixelGrid.createEmpty(8, 8);
    const state = createFloatingState(grid, 2, 2, "layer");

    cancelFloating(grid, state);

    expect(grid.getPixel(2, 2)).toBe(rgba(255, 0, 0));
    expect(grid.getPixel(3, 3)).toBe(rgba(0, 255, 0));
  });

  it("invert preserves floating buffer", () => {
    const grid = PixelGrid.createEmpty(8, 8);
    const state = createFloatingState(grid, 1, 1, "layer");
    const floatingPixels = state.floating!.pixels.getPixel(0, 0);

    const inverted = invertFloatingSelection(state);

    expect(inverted.floating).not.toBeNull();
    expect(inverted.floating!.pixels.getPixel(0, 0)).toBe(floatingPixels);
    expect(isMaskSelected(inverted.mask, 0, 0)).toBe(true);
    expect(isMaskSelected(inverted.mask, 1, 1)).toBe(false);
  });

  it("syncMaskWithFloating rebuilds mask from floating offset", () => {
    const grid = PixelGrid.createEmpty(8, 8);
    const state = createFloatingState(grid, 1, 1, "paste");
    const moved = withFloating(state, {
      ...state.floating!,
      offset: { x: 3, y: 3 },
    });

    const synced = syncMaskWithFloating(moved);

    expect(isMaskSelected(synced.mask, 3, 3)).toBe(true);
    expect(isMaskSelected(synced.mask, 1, 1)).toBe(false);
  });
});
