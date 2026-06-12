import { describe, expect, it } from "vitest";
import { HistoryStack } from "@/domain/history/HistoryStack";
import { createEmptyMask } from "@/domain/selection/SelectionMask";
import { createSelectionState } from "@/domain/selection/SelectionState";

describe("HistoryStack", () => {
  it("pushes and undoes layer snapshots", () => {
    const stack = new HistoryStack();
    const pixels = new Uint32Array([1, 2, 3, 4]);
    const selection = createSelectionState(createEmptyMask(2, 2));

    stack.push({ layerId: "layer-1", pixels, selection: null });

    expect(stack.canUndo).toBe(true);
    expect(stack.canRedo).toBe(false);

    const current = {
      layerId: "layer-1",
      pixels: new Uint32Array([9, 9, 9, 9]),
      selection,
    };

    const restored = stack.undo(current);
    expect(restored?.pixels).toEqual(pixels);
    expect(stack.canRedo).toBe(true);
  });

  it("clears redo stack on new push", () => {
    const stack = new HistoryStack();
    stack.push({
      layerId: "a",
      pixels: new Uint32Array([1]),
      selection: null,
    });

    const current = {
      layerId: "a",
      pixels: new Uint32Array([2]),
      selection: null,
    };

    stack.undo(current);
    expect(stack.canRedo).toBe(true);

    stack.push({
      layerId: "a",
      pixels: new Uint32Array([3]),
      selection: null,
    });

    expect(stack.canRedo).toBe(false);
  });
});
