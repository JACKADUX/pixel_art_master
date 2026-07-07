import { describe, expect, it } from "vitest";
import { rgba } from "@/domain/canvas/PixelColor";
import { PixelGrid } from "@/domain/canvas/PixelGrid";
import { createEmptyDrawingLayer } from "@/domain/layer/Layer";
import { createEmptyProject } from "@/domain/project/Project";
import { createSelectionFromFloating } from "@/application/use-cases/ClipboardUseCases";
import {
  ensureActiveLayerContainsFloatingSelectionInProject,
  getActiveLayerProjectedSurfaceFromProject,
} from "@/application/use-cases/LayerUseCases";
import {
  handleSelectPointerDown,
  handleSelectPointerMove,
} from "@/presentation/controllers/canvasInteraction";
import {
  isPointInSelection,
  moveFloatingSelection,
} from "@/application/use-cases/SelectionUseCases";
import { HistoryStack } from "@/domain/history/HistoryStack";
import { DEFAULT_TOOL_SETTINGS } from "@/domain/tool/ToolType";

const clipboardStub = {
  copyImage: async () => {},
  readImage: async () => null,
};

describe("copy paste selection drag", () => {
  it("treats clicks inside floating bounds as hits even on transparent cells", () => {
    const pixels = PixelGrid.createEmpty(5, 5);
    pixels.setPixel(2, 2, rgba(255, 0, 0, 255));
    const selection = createSelectionFromFloating(
      {
        pixels,
        offset: { x: 10, y: 10 },
        originInLayer: { x: 10, y: 10 },
        source: "paste",
      },
      64,
      64,
    );

    expect(isPointInSelection(selection, { x: 10, y: 10 })).toBe(true);
    expect(isPointInSelection(selection, { x: 11, y: 11 })).toBe(true);
    expect(isPointInSelection(selection, { x: 9, y: 10 })).toBe(false);
  });

  it("allows dragging after paste when layer is smaller than pasted bounds", async () => {
    const layer = createEmptyDrawingLayer({ width: 8, height: 8 });
    const project = createEmptyProject("test", { width: 64, height: 64 });
    project.canvas.layers = [layer];
    project.canvas.activeLayerId = layer.id;

    const pixels = PixelGrid.createEmpty(3, 3);
    pixels.setPixel(1, 1, rgba(0, 255, 0, 255));
    const floating = {
      pixels,
      offset: { x: 20, y: 20 },
      originInLayer: { x: 20, y: 20 },
      source: "paste" as const,
    };

    const pasted = await import("@/application/use-cases/ClipboardUseCases").then((m) =>
      m.pasteFromClipboard(clipboardStub, 64, 64, floating),
    );
    expect(pasted?.floating).not.toBeNull();

    const expandedProject = ensureActiveLayerContainsFloatingSelectionInProject(
      project,
      pasted,
    );
    getActiveLayerProjectedSurfaceFromProject(expandedProject);

    const clickPoint = {
      x: pasted!.floating!.offset.x + 1,
      y: pasted!.floating!.offset.y + 1,
    };
    const historyStack = new HistoryStack();
    const surface = getActiveLayerProjectedSurfaceFromProject(expandedProject);

    const down = handleSelectPointerDown({
      project: expandedProject,
      grid: surface,
      point: clickPoint,
      settings: DEFAULT_TOOL_SETTINGS,
      selection: pasted,
      modifiers: { shiftKey: false, altKey: false, ctrlKey: false, spaceKey: false },
      historyStack,
    });

    expect(down.selectionDrag?.mode).toBe("move");

    const move = handleSelectPointerMove({
      project: expandedProject,
      point: { x: clickPoint.x + 4, y: clickPoint.y + 2 },
      settings: DEFAULT_TOOL_SETTINGS,
      selection: down.selection,
      selectionDrag: down.selectionDrag!,
      lassoPoints: [],
      grid: surface,
      modifiers: { shiftKey: false, altKey: false, ctrlKey: false, spaceKey: false },
      historyStack,
    });

    expect(move.selection?.floating?.offset).toEqual({
      x: pasted!.floating!.offset.x + 4,
      y: pasted!.floating!.offset.y + 2,
    });
  });

  it("moves pasted selection via moveFloatingSelection", () => {
    const pixels = PixelGrid.createEmpty(2, 2);
    pixels.setPixel(0, 0, rgba(255, 0, 0, 255));
    let selection = createSelectionFromFloating(
      {
        pixels,
        offset: { x: 4, y: 4 },
        originInLayer: { x: 4, y: 4 },
        source: "paste",
      },
      32,
      32,
    );

    selection = moveFloatingSelection(selection, 3, 1);
    expect(selection.floating?.offset).toEqual({ x: 7, y: 5 });
  });
});
