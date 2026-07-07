import { describe, expect, it } from "vitest";
import { PixelGrid } from "@/domain/canvas/PixelGrid";
import { wrapLayerOnCanvas } from "@/domain/canvas/LayerProjectedSurface";
import { rgba } from "@/domain/canvas/PixelColor";
import { HistoryStack } from "@/domain/history/HistoryStack";
import {
  beginMoveSelection,
  moveFloatingSelection,
} from "@/application/use-cases/SelectionUseCases";
import { getActiveLayerProjectedSurfaceFromProject } from "@/application/use-cases/LayerUseCases";
import { createSelectionFromFloating } from "@/application/use-cases/ClipboardUseCases";
import { createRectMask } from "@/domain/selection/SelectionMaskOperations";
import { isMaskSelected } from "@/domain/selection/SelectionMask";
import { createSelectionState } from "@/domain/selection/SelectionState";
import { createEmptyProject } from "@/domain/project/Project";
import { DEFAULT_TOOL_SETTINGS } from "@/domain/tool/ToolType";
import {
  handleSelectPointerMove,
  handleSelectPointerUp,
  handleTransformPointerDown,
  handleTransformPointerMove,
  handleTransformPointerUp,
  resolveLayerPositionFromDrag,
} from "@/presentation/controllers/canvasInteraction";
import { moveDrawingLayerInProject } from "@/application/use-cases/MoveDrawingLayer";
import { toggleDrawingLayerLockInProject } from "@/application/use-cases/LayerUseCases";
import { getActiveLayer } from "@/domain/project/Project";
import { isDrawingLayer } from "@/domain/layer/LayerTypeGuards";

function canvasSurface(width: number, height: number) {
  const layerGrid = PixelGrid.createEmpty(width, height);
  return wrapLayerOnCanvas(layerGrid, { x: 0, y: 0 }, { width, height });
}

describe("handleSelectPointerUp blank click", () => {
  it("commits floating selection when clicking blank to deselect", () => {
    const project = createEmptyProject("test");
    const grid = canvasSurface(8, 8);
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
      modifiers: { shiftKey: false, altKey: false, ctrlKey: false, spaceKey: false },
      historyStack,
      grid,
    });

    expect(result.selection).toBeNull();
    expect(result.project).toBeDefined();
    const surface = getActiveLayerProjectedSurfaceFromProject(result.project!);
    expect(surface.getPixel(2, 2)).toBe(rgba(255, 0, 0));
  });

  it("commits floating selection when box-selecting a new area", () => {
    const project = createEmptyProject("test");
    const grid = canvasSurface(8, 8);
    grid.setPixel(2, 2, rgba(255, 0, 0));
    const mask = createRectMask({ x: 2, y: 2 }, { x: 2, y: 2 }, 8, 8);
    let selection = createSelectionState(mask);
    selection = beginMoveSelection(grid, selection);
    selection = moveFloatingSelection(selection, 2, 0);
    const historyStack = new HistoryStack();

    const result = handleSelectPointerUp({
      project,
      point: { x: 1, y: 1 },
      settings: DEFAULT_TOOL_SETTINGS,
      selection,
      selectionDrag: {
        start: { x: 0, y: 0 },
        current: { x: 1, y: 1 },
        mode: "create",
      },
      lassoPoints: [],
      modifiers: { shiftKey: false, altKey: false, ctrlKey: false, spaceKey: false },
      historyStack,
      grid,
    });

    expect(result.project).toBeDefined();
    const surface = getActiveLayerProjectedSurfaceFromProject(result.project!);
    expect(surface.getPixel(4, 2)).toBe(rgba(255, 0, 0));
    expect(surface.getPixel(2, 2)).toBe(0);
    expect(result.selection).not.toBeNull();
    expect(isMaskSelected(result.selection!.mask, 0, 0)).toBe(true);
    expect(result.selection!.floating).toBeNull();
  });
});

describe("handleSelectPointerMove create offset", () => {
  it("offsets the in-progress marquee while space is held", () => {
    const project = createEmptyProject("test");
    const grid = canvasSurface(16, 16);
    const historyStack = new HistoryStack();
    const selectionDrag = {
      start: { x: 1, y: 1 },
      current: { x: 4, y: 4 },
      mode: "create" as const,
    };

    const withOffset = handleSelectPointerMove({
      project,
      point: { x: 4, y: 4 },
      settings: DEFAULT_TOOL_SETTINGS,
      selection: null,
      selectionDrag,
      lassoPoints: [],
      grid,
      modifiers: { shiftKey: false, altKey: false, ctrlKey: false, spaceKey: true },
      historyStack,
    });

    expect(withOffset.selectionDrag.createOffset).toEqual({
      anchor: { x: 4, y: 4 },
      baseStart: { x: 1, y: 1 },
      baseCurrent: { x: 4, y: 4 },
      baseLassoPoints: [],
    });

    const moved = handleSelectPointerMove({
      project,
      point: { x: 6, y: 5 },
      settings: DEFAULT_TOOL_SETTINGS,
      selection: null,
      selectionDrag: withOffset.selectionDrag,
      lassoPoints: [],
      grid,
      modifiers: { shiftKey: false, altKey: false, ctrlKey: false, spaceKey: true },
      historyStack,
    });

    expect(moved.selectionDrag.start).toEqual({ x: 3, y: 2 });
    expect(moved.selectionDrag.current).toEqual({ x: 6, y: 5 });
    expect(moved.selectionPreviewRect).toEqual({
      x: 3,
      y: 2,
      width: 4,
      height: 4,
    });

    const resumed = handleSelectPointerMove({
      project,
      point: { x: 7, y: 6 },
      settings: DEFAULT_TOOL_SETTINGS,
      selection: null,
      selectionDrag: moved.selectionDrag,
      lassoPoints: [],
      grid,
      modifiers: { shiftKey: false, altKey: false, ctrlKey: false, spaceKey: false },
      historyStack,
    });

    expect(resumed.selectionDrag.createOffset).toBeUndefined();
    expect(resumed.selectionDrag.start).toEqual({ x: 4, y: 3 });
    expect(resumed.selectionDrag.current).toEqual({ x: 7, y: 6 });
    expect(resumed.selectionPreviewRect).toEqual({
      x: 4,
      y: 3,
      width: 4,
      height: 4,
    });
  });
});

describe("handleTransformPointerDown layer position", () => {
  it("starts layer position drag without selection in move mode", () => {
    const project = createEmptyProject("test");
    const grid = canvasSurface(8, 8);
    grid.setPixel(2, 2, rgba(255, 0, 0));
    const historyStack = new HistoryStack();

    const down = handleTransformPointerDown({
      project,
      grid,
      point: { x: 1, y: 1 },
      selection: null,
      historyStack,
      transformMode: "move",
      zoom: 1,
    });

    expect(down.selectionDrag?.mode).toBe("layerPosition");
    expect(down.selectionDrag?.initialPosition).toEqual({ x: 0, y: 0 });
    expect(down.selection).toBeNull();
    expect(grid.getPixel(2, 2)).toBe(rgba(255, 0, 0));
  });

  it("does not start layer position drag when active layer is locked", () => {
    const base = createEmptyProject("test", { width: 8, height: 8 });
    const activeLayer = getActiveLayer(base);
    const project = toggleDrawingLayerLockInProject(base, activeLayer.id);
    const grid = canvasSurface(8, 8);
    const historyStack = new HistoryStack();

    const down = handleTransformPointerDown({
      project,
      grid,
      point: { x: 1, y: 1 },
      selection: null,
      historyStack,
      transformMode: "move",
      zoom: 1,
    });

    expect(down.selectionDrag).toBeNull();
  });

  it("does not start layer position drag in scale mode without selection", () => {
    const project = createEmptyProject("test");
    const grid = canvasSurface(8, 8);
    grid.setPixel(2, 2, rgba(255, 0, 0));
    const historyStack = new HistoryStack();

    const down = handleTransformPointerDown({
      project,
      grid,
      point: { x: 1, y: 1 },
      selection: null,
      historyStack,
      transformMode: "scale",
      zoom: 1,
    });

    expect(down.selectionDrag).toBeNull();
    expect(down.selection).toBeNull();
    expect(grid.getPixel(2, 2)).toBe(rgba(255, 0, 0));
  });

  it("updates layer position from drag delta", () => {
    const project = createEmptyProject("test", { width: 8, height: 8 });
    const grid = canvasSurface(8, 8);
    const historyStack = new HistoryStack();

    const down = handleTransformPointerDown({
      project,
      grid,
      point: { x: 1, y: 1 },
      selection: null,
      historyStack,
      transformMode: "move",
      zoom: 1,
    });

    const nextPosition = resolveLayerPositionFromDrag(down.selectionDrag!, { x: 3, y: 1 });
    expect(nextPosition).toEqual({ x: 2, y: 0 });

    const activeLayer = getActiveLayer(project);
    expect(isDrawingLayer(activeLayer)).toBe(true);
    const moved = moveDrawingLayerInProject(project, activeLayer.id, nextPosition!);
    expect(moved).not.toBeNull();

    const movedLayer = getActiveLayer(moved!);
    expect(isDrawingLayer(movedLayer)).toBe(true);
    if (isDrawingLayer(movedLayer)) {
      expect(movedLayer.position).toEqual({ x: 2, y: 0 });
    }

    const up = handleTransformPointerUp({
      grid,
      selection: null,
      selectionDrag: down.selectionDrag,
    });

    expect(up.selection).toBeNull();
    expect(up.selectionDrag).toBeNull();
  });

  it("does not move locked drawing layer", () => {
    const base = createEmptyProject("test", { width: 8, height: 8 });
    const activeLayer = getActiveLayer(base);
    const project = toggleDrawingLayerLockInProject(base, activeLayer.id);

    const moved = moveDrawingLayerInProject(project, activeLayer.id, { x: 2, y: 0 });
    expect(moved).toBeNull();
  });
});

describe("handleTransformPointerDown selection handles", () => {
  it("starts resizing from an edge segment away from the old center handle", () => {
    const project = createEmptyProject("test", { width: 32, height: 32 });
    const grid = canvasSurface(32, 32);
    const mask = createRectMask({ x: 4, y: 4 }, { x: 23, y: 13 }, 32, 32);
    const selection = createSelectionState(mask);
    const historyStack = new HistoryStack();

    const down = handleTransformPointerDown({
      project,
      grid,
      point: { x: 8, y: 4 },
      selection,
      historyStack,
      transformMode: "scale",
      zoom: 1,
    });

    expect(down.selectionDrag?.mode).toBe("transform");
    expect(down.selectionDrag?.transformHandle).toBe("top");
  });

  it("keeps the rotated floating selection centered while dragging the rotate handle", () => {
    const project = createEmptyProject("test", { width: 16, height: 16 });
    const grid = canvasSurface(16, 16);
    grid.setPixel(2, 2, rgba(255, 0, 0));
    grid.setPixel(3, 2, rgba(0, 255, 0));
    const mask = createRectMask({ x: 2, y: 2 }, { x: 3, y: 2 }, 16, 16);
    const selection = createSelectionState(mask);
    const historyStack = new HistoryStack();

    const down = handleTransformPointerDown({
      project,
      grid,
      point: { x: 3, y: -18 },
      selection,
      historyStack,
      transformMode: "rotate",
      zoom: 1,
    });
    expect(down.selectionDrag?.transformHandle).toBe("rotate");

    const moved = handleTransformPointerMove({
      point: { x: 23, y: 2.5 },
      selection: down.selection!,
      selectionDrag: down.selectionDrag!,
      grid,
      shiftKey: true,
      altKey: false,
    });

    expect(moved.selection.floating?.pixels.width).toBe(1);
    expect(moved.selection.floating?.pixels.height).toBe(2);
    expect(moved.selection.floating?.offset).toEqual({ x: 3, y: 2 });
  });
});
