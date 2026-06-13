import { describe, expect, it } from "vitest";
import { PixelGrid } from "@/domain/canvas/PixelGrid";
import { rgba, TRANSPARENT } from "@/domain/canvas/PixelColor";
import { createSelectionFromFloating } from "@/application/use-cases/ClipboardUseCases";
import {
  beginMoveSelection,
  cancelFloatingSelection,
  createFloatingFromCut,
  invertSelection,
  moveFloatingSelection,
  commitFloatingSelection,
} from "@/application/use-cases/SelectionUseCases";
import { createRectMask } from "@/domain/selection/SelectionMaskOperations";
import { isMaskSelected } from "@/domain/selection/SelectionMask";
import { createSelectionState } from "@/domain/selection/SelectionState";

describe("SelectionUseCases floating model", () => {
  it("invert then cancel restores lifted pixels after nudge", () => {
    const grid = PixelGrid.createEmpty(8, 8);
    grid.setPixel(2, 2, rgba(255, 0, 0));
    grid.setPixel(5, 5, rgba(0, 255, 0));
    const mask = createRectMask({ x: 2, y: 2 }, { x: 2, y: 2 }, 8, 8);
    let state = createSelectionState(mask);

    state = beginMoveSelection(grid, state);
    state = invertSelection(state);
    const { grid: restoredGrid, selection: restoredSelection } =
      cancelFloatingSelection(grid, state);

    expect(restoredGrid.getPixel(2, 2)).toBe(rgba(255, 0, 0));
    expect(restoredSelection.floating).toBeNull();
    expect(restoredGrid.getPixel(5, 5)).toBe(rgba(0, 255, 0));
  });

  it("cut creates floating selection with cleared source", () => {
    const grid = PixelGrid.createEmpty(8, 8);
    grid.setPixel(2, 2, rgba(255, 0, 0));
    const mask = createRectMask({ x: 2, y: 2 }, { x: 2, y: 2 }, 8, 8);
    const state = createSelectionState(mask);

    const result = createFloatingFromCut(grid, state);
    expect(result).not.toBeNull();
    expect(result!.selection.floating?.source).toBe("cut");
    expect(result!.grid.getPixel(2, 2)).toBe(TRANSPARENT);
  });

  it("paste float can move independently and commit to new location", () => {
    const grid = PixelGrid.createEmpty(8, 8);
    grid.setPixel(2, 2, rgba(255, 0, 0));
    const pixels = PixelGrid.createEmpty(1, 1);
    pixels.setPixel(0, 0, rgba(255, 0, 0));
    let state = createSelectionFromFloating(
      {
        pixels,
        offset: { x: 2, y: 2 },
        originInLayer: { x: 2, y: 2 },
        source: "paste",
      },
      8,
      8,
    );

    state = moveFloatingSelection(state, 2, 0);
    const { grid: committedGrid, selection: committed } = commitFloatingSelection(grid, state);

    expect(committedGrid.getPixel(2, 2)).toBe(rgba(255, 0, 0));
    expect(committedGrid.getPixel(4, 2)).toBe(rgba(255, 0, 0));
    expect(isMaskSelected(committed.mask, 4, 2)).toBe(true);
    expect(isMaskSelected(committed.mask, 2, 2)).toBe(false);
  });
});
