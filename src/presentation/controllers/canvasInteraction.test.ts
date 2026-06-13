import { describe, expect, it } from "vitest";
import { PixelGrid } from "@/domain/canvas/PixelGrid";
import { rgba } from "@/domain/canvas/PixelColor";
import { HistoryStack } from "@/domain/history/HistoryStack";
import { createSelectionFromFloating } from "@/application/use-cases/ClipboardUseCases";
import { createEmptyProject } from "@/domain/project/Project";
import { DEFAULT_TOOL_SETTINGS } from "@/domain/tool/ToolType";
import {
  handleSelectPointerUp,
  handleTransformPointerDown,
  handleTransformPointerMove,
  handleTransformPointerUp,
} from "@/presentation/controllers/canvasInteraction";

describe("handleSelectPointerUp blank click", () => {
  it("commits floating selection when clicking blank to deselect", () => {
    const project = createEmptyProject("test");
    const grid = PixelGrid.createEmpty(8, 8);
    const pixels = PixelGrid.createEmpty(1, 1);
    pixels.setPixel(0, 0, rgba(255, 0, 0));
    const selection = createSelectionFromFloating(
      {
        pixels,
        offset: { x: 2, y: 2 },
        originInLayer: { x: 2, y: 2 },
        source: "paste",
      },
      8,
      8,
    );
    const historyStack = new HistoryStack();

    const result = handleSelectPointerUp({
      project,
      point: { x: 0, y: 0 },
      settings: DEFAULT_TOOL_SETTINGS,
      selection,
      selectionDrag: {
        start: { x: 0, y: 0 },
        current: { x: 0, y: 0 },
        mode: "create",
      },
      lassoPoints: [],
      modifiers: { shiftKey: false, altKey: false, spaceKey: false },
      historyStack,
      grid,
    });

    expect(result.selection).toBeNull();
    expect(result.grid?.getPixel(2, 2)).toBe(rgba(255, 0, 0));
  });
});

describe("handleTransformPointerDown layer pan", () => {
  it("starts layer pan without selection in move mode", () => {
    const project = createEmptyProject("test");
    const grid = PixelGrid.createEmpty(8, 8);
    grid.setPixel(2, 2, rgba(255, 0, 0));
    const historyStack = new HistoryStack();

    const down = handleTransformPointerDown({
      project,
      grid,
      point: { x: 1, y: 1 },
      selection: null,
      historyStack,
      transformMode: "move",
    });

    expect(down.selectionDrag?.layerPan).toBe(true);
    expect(down.selectionDrag?.transformHandle).toBe("move");
    expect(down.selection?.floating).not.toBeNull();
    expect(grid.getPixel(2, 2)).toBe(0);
  });

  it("does not start layer pan in scale mode without selection", () => {
    const project = createEmptyProject("test");
    const grid = PixelGrid.createEmpty(8, 8);
    grid.setPixel(2, 2, rgba(255, 0, 0));
    const historyStack = new HistoryStack();

    const down = handleTransformPointerDown({
      project,
      grid,
      point: { x: 1, y: 1 },
      selection: null,
      historyStack,
      transformMode: "scale",
    });

    expect(down.selectionDrag).toBeNull();
    expect(down.selection).toBeNull();
    expect(grid.getPixel(2, 2)).toBe(rgba(255, 0, 0));
  });

  it("commits layer pan on pointer up", () => {
    const project = createEmptyProject("test");
    const grid = PixelGrid.createEmpty(8, 8);
    grid.setPixel(2, 2, rgba(255, 0, 0));
    const historyStack = new HistoryStack();

    const down = handleTransformPointerDown({
      project,
      grid,
      point: { x: 1, y: 1 },
      selection: null,
      historyStack,
      transformMode: "move",
    });

    const moved = handleTransformPointerMove({
      point: { x: 3, y: 1 },
      selection: down.selection!,
      selectionDrag: down.selectionDrag!,
      grid,
      shiftKey: false,
      altKey: false,
    });

    const up = handleTransformPointerUp({
      grid,
      selection: moved.selection,
      selectionDrag: moved.selectionDrag,
    });

    expect(up.selection).toBeNull();
    expect(up.grid?.getPixel(2, 2)).toBe(0);
    expect(up.grid?.getPixel(4, 2)).toBe(rgba(255, 0, 0));
  });
});
