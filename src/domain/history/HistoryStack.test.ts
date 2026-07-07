import { describe, expect, it } from "vitest";
import { HistoryStack } from "@/domain/history/HistoryStack";
import type { PixelSnapshot, StructureSnapshot } from "@/domain/history/HistoryStack";
import type { DrawingLayer } from "@/domain/layer/Layer";
import { createEmptyMask } from "@/domain/selection/SelectionMask";
import { createSelectionState } from "@/domain/selection/SelectionState";

function pixelSnapshot(
  layerId: string,
  pixels: number[],
  selection: PixelSnapshot["selection"] = null,
  width = 2,
  height = 2,
  position: PixelSnapshot["position"] = { x: 0, y: 0 },
  canvasId = "canvas-1",
): PixelSnapshot {
  return {
    kind: "pixels",
    canvasId,
    layerId,
    width,
    height,
    position,
    pixels: new Uint32Array(pixels),
    selection,
  };
}

function drawingLayer(id: string, pixels: number[], width = 2, height = 2): DrawingLayer {
  return {
    id,
    name: id,
    type: "drawing",
    visible: true,
    opacity: 255,
    locked: false,
    width,
    height,
    position: { x: 0, y: 0 },
    pixels: new Uint32Array(pixels),
  };
}

function structureSnapshot(
  layers: DrawingLayer[],
  activeLayerId: string,
  canvasWidth = 2,
  canvasHeight = 2,
  canvasId = "canvas-1",
): StructureSnapshot {
  return {
    kind: "structure",
    canvasId,
    canvasWidth,
    canvasHeight,
    layers,
    activeLayerId,
    referenceLayers: [],
    activeReferenceLayerId: null,
    selection: null,
  };
}

describe("HistoryStack", () => {
  it("pushes and undoes layer snapshots", () => {
    const stack = new HistoryStack();
    const selection = createSelectionState(createEmptyMask(2, 2));

    stack.push(pixelSnapshot("layer-1", [1, 2, 3, 4]));

    expect(stack.canUndo).toBe(true);
    expect(stack.canRedo).toBe(false);

    const restored = stack.undo(pixelSnapshot("layer-1", [9, 9, 9, 9], selection));
    expect(restored?.kind).toBe("pixels");
    expect((restored as PixelSnapshot).pixels).toEqual(new Uint32Array([1, 2, 3, 4]));
    expect(stack.canRedo).toBe(true);
  });

  it("clears redo stack on new push", () => {
    const stack = new HistoryStack();
    stack.push(pixelSnapshot("a", [1]));

    stack.undo(pixelSnapshot("a", [2]));
    expect(stack.canRedo).toBe(true);

    stack.push(pixelSnapshot("a", [3]));
    expect(stack.canRedo).toBe(false);
  });

  it("reports the kind of the next undo/redo entry", () => {
    const stack = new HistoryStack();
    expect(stack.nextUndoKind).toBeNull();

    stack.push(pixelSnapshot("a", [1]));
    stack.push(structureSnapshot([drawingLayer("a", [1])], "a"));

    expect(stack.nextUndoKind).toBe("structure");
    expect(stack.nextUndoEntry?.kind).toBe("structure");

    stack.undo(structureSnapshot([drawingLayer("a", [1]), drawingLayer("b", [2])], "a"));
    expect(stack.nextUndoKind).toBe("pixels");
    expect(stack.nextUndoEntry?.kind).toBe("pixels");
    expect(stack.nextRedoKind).toBe("structure");
    expect(stack.nextRedoEntry?.kind).toBe("structure");
  });

  it("round-trips a structure snapshot for layer deletion", () => {
    const stack = new HistoryStack();
    const before = [drawingLayer("a", [1]), drawingLayer("b", [2])];
    const after = [drawingLayer("a", [1])];

    // Record the structure before deleting layer "b".
    stack.push(structureSnapshot(before, "a"));

    // Undo should restore the two-layer structure.
    const restored = stack.undo(structureSnapshot(after, "a")) as StructureSnapshot;
    expect(restored.kind).toBe("structure");
    expect(restored.layers.map((l) => l.id)).toEqual(["a", "b"]);

    // Redo should re-apply the deletion (single layer).
    const redone = stack.redo(structureSnapshot(before, "a")) as StructureSnapshot;
    expect(redone.layers.map((l) => l.id)).toEqual(["a"]);
  });

  it("deep clones layers so snapshots are immutable", () => {
    const stack = new HistoryStack();
    const layer = drawingLayer("a", [1, 2]);
    stack.push(structureSnapshot([layer], "a"));

    layer.pixels[0] = 999;

    const restored = stack.undo(structureSnapshot([drawingLayer("a", [0, 0])], "a")) as StructureSnapshot;
    expect(restored.layers[0].type).toBe("drawing");
    expect((restored.layers[0] as DrawingLayer).pixels).toEqual(new Uint32Array([1, 2]));
  });
});
