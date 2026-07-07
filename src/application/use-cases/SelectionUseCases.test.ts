import { describe, expect, it } from "vitest";
import { PixelGrid } from "@/domain/canvas/PixelGrid";
import { rgba, TRANSPARENT } from "@/domain/canvas/PixelColor";
import { createEmptyReferenceLayer } from "@/domain/layer/Layer";
import { createEmptyProject, withLayers } from "@/domain/project/Project";
import { setActiveReferenceLayer } from "@/application/use-cases/LayerUseCases";
import { createSelectionFromFloating } from "@/application/use-cases/ClipboardUseCases";
import {
  beginMoveSelection,
  cancelFloatingSelection,
  createFloatingFromCut,
  invertSelection,
  moveFloatingSelection,
  commitFloatingSelection,
  nudgeSelection,
  resolveSelectionForTransform,
} from "@/application/use-cases/SelectionUseCases";
import { createRectMask } from "@/domain/selection/SelectionMaskOperations";
import { isMaskSelected } from "@/domain/selection/SelectionMask";
import { createSelectionState } from "@/domain/selection/SelectionState";

function setDrawingPixel(
  project: ReturnType<typeof createEmptyProject>,
  x: number,
  y: number,
  color: number,
) {
  const drawing = project.canvas.layers.find((layer) => layer.type === "drawing");
  if (!drawing || drawing.type !== "drawing") return;
  drawing.pixels[y * project.canvas.width + x] = color;
}

describe("resolveSelectionForTransform", () => {
  it("returns existing selection when one is already active", () => {
    const project = createEmptyProject("test", { width: 8, height: 8 });
    const mask = createRectMask({ x: 1, y: 1 }, { x: 3, y: 3 }, 8, 8);
    const selection = createSelectionState(mask);

    expect(resolveSelectionForTransform(project, selection)).toBe(selection);
  });

  it("selects opaque pixels on the active drawing layer when selection is empty", () => {
    const project = createEmptyProject("test", { width: 8, height: 8 });
    setDrawingPixel(project, 2, 2, rgba(255, 0, 0));
    setDrawingPixel(project, 4, 3, rgba(0, 255, 0));

    const resolved = resolveSelectionForTransform(project, null);

    expect(resolved).not.toBeNull();
    expect(resolved!.bounds).toEqual({ x: 2, y: 2, width: 3, height: 2 });
    expect(isMaskSelected(resolved!.mask, 2, 2)).toBe(true);
    expect(isMaskSelected(resolved!.mask, 4, 3)).toBe(true);
    expect(isMaskSelected(resolved!.mask, 0, 0)).toBe(false);
  });

  it("returns null when the active drawing layer has no opaque pixels", () => {
    const project = createEmptyProject("test", { width: 8, height: 8 });

    expect(resolveSelectionForTransform(project, null)).toBeNull();
  });

  it("returns null when a reference layer is active", () => {
    const reference = createEmptyReferenceLayer("ref");
    const baseProject = createEmptyProject("test", { width: 8, height: 8 });
    const project = setActiveReferenceLayer(
      withLayers(baseProject, [...baseProject.canvas.layers, reference]),
      reference.id,
    );
    setDrawingPixel(project, 2, 2, rgba(255, 0, 0));

    expect(resolveSelectionForTransform(project, null)).toBeNull();
  });
});

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

  it("nudge clears source pixels when selection is not yet floating", () => {
    const grid = PixelGrid.createEmpty(8, 8);
    grid.setPixel(2, 2, rgba(255, 0, 0));
    const mask = createRectMask({ x: 2, y: 2 }, { x: 2, y: 2 }, 8, 8);
    const state = createSelectionState(mask);

    const { selection } = nudgeSelection(grid, state, 1, 0);

    expect(grid.getPixel(2, 2)).toBe(TRANSPARENT);
    expect(selection.floating?.offset).toEqual({ x: 3, y: 2 });
    expect(selection.floating?.pixels.getPixel(0, 0)).toBe(rgba(255, 0, 0));
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
