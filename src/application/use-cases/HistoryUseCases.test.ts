import { describe, expect, it } from "vitest";
import {
  applyStructureSnapshot,
  captureEditorSnapshot,
  captureStructureSnapshot,
  pushHistory,
  pushStructureHistory,
  undoHistory,
} from "./HistoryUseCases";
import { HistoryStack } from "@/domain/history/HistoryStack";
import { createEmptyProject } from "@/domain/project/Project";
import { resizeProjectCanvas } from "@/domain/project/Project";
import { expandDrawingLayerToIncludeCanvasPoint } from "@/domain/layer/DrawingLayerOperations";
import { createEmptyDrawingLayer } from "@/domain/layer/Layer";
import { getCompositeGrid } from "@/domain/project/Project";
import { rgba } from "@/domain/canvas/PixelColor";

describe("HistoryUseCases canvas resize", () => {
  it("undoes canvas edge resize by restoring dimensions and layer pixels", () => {
    const project = createEmptyProject("test", { width: 64, height: 64 });
    const historyStack = new HistoryStack();

    pushStructureHistory(historyStack, project, null);
    const resized = resizeProjectCanvas(project, 96, 64);

    const result = undoHistory(historyStack, resized, null);
    expect(result).not.toBeNull();
    expect(result!.structural).toBe(true);
    expect(result!.project.canvas.width).toBe(64);
    expect(result!.project.canvas.height).toBe(64);
    expect(result!.project.canvas.layers[0].type).toBe("drawing");
    if (result!.project.canvas.layers[0].type === "drawing") {
      expect(result!.project.canvas.layers[0].pixels.length).toBe(64 * 64);
    }
  });

  it("applyStructureSnapshot restores canvas dimensions from snapshot", () => {
    const project = createEmptyProject("test", { width: 32, height: 32 });
    const snapshot = captureStructureSnapshot(project, null);
    if (snapshot.kind !== "structure") {
      throw new Error("expected structure snapshot");
    }
    const resized = resizeProjectCanvas(project, 64, 64);
    const restored = applyStructureSnapshot(resized, snapshot);

    expect(restored.canvas.width).toBe(32);
    expect(restored.canvas.height).toBe(32);
  });

  it("expands drawing layers when canvas grows", () => {
    const project = createEmptyProject("test", { width: 64, height: 64 });
    const layer = project.canvas.layers.find((entry) => entry.type === "drawing");
    if (!layer || layer.type !== "drawing") {
      throw new Error("drawing layer missing");
    }
    layer.pixels[0] = 0xff0000ff;

    const resized = resizeProjectCanvas(project, 96, 80);
    const resizedLayer = resized.canvas.layers.find((entry) => entry.id === layer.id);
    expect(resizedLayer?.type).toBe("drawing");
    if (resizedLayer?.type === "drawing") {
      expect(resizedLayer.width).toBe(96);
      expect(resizedLayer.height).toBe(80);
      expect(resizedLayer.position).toEqual({ x: 0, y: 0 });
      expect(resizedLayer.pixels.length).toBe(96 * 80);
      expect(resizedLayer.pixels[0]).toBe(0xff0000ff);
    }
  });

  it("does not resize drawing layer pixels when canvas shrinks", () => {
    const project = createEmptyProject("test", { width: 64, height: 64 });
    const layer = project.canvas.layers.find((entry) => entry.type === "drawing");
    if (!layer || layer.type !== "drawing") {
      throw new Error("drawing layer missing");
    }
    layer.pixels[0] = 0xff0000ff;

    const resized = resizeProjectCanvas(project, 32, 32);
    const resizedLayer = resized.canvas.layers.find((entry) => entry.id === layer.id);
    expect(resizedLayer?.type).toBe("drawing");
    if (resizedLayer?.type === "drawing") {
      expect(resizedLayer.width).toBe(64);
      expect(resizedLayer.height).toBe(64);
      expect(resizedLayer.position).toEqual({ x: 0, y: 0 });
      expect(resizedLayer.pixels.length).toBe(64 * 64);
      expect(resizedLayer.pixels[0]).toBe(0xff0000ff);
    }
  });
});

describe("HistoryUseCases layer geometry", () => {
  it("restores layer width, height, and position when undoing after draw-time expansion", () => {
    const baseLayer = createEmptyDrawingLayer({ width: 32, height: 32 });
    baseLayer.pixels[0] = rgba(255, 0, 0, 255);
    const project = createEmptyProject("test", { width: 64, height: 64 });
    project.canvas.layers = [baseLayer];
    project.canvas.activeLayerId = baseLayer.id;

    const historyStack = new HistoryStack();
    pushHistory(historyStack, project, null);

    const expandedLayer = expandDrawingLayerToIncludeCanvasPoint(baseLayer, { x: 40, y: 35 });
    expandedLayer.pixels[35 * expandedLayer.width + 40] = rgba(0, 0, 255, 255);
    const expandedProject = {
      ...project,
      canvas: {
        ...project.canvas,
        layers: [expandedLayer],
      },
    };

    expect(expandedLayer.width).toBeGreaterThan(baseLayer.width);
    getCompositeGrid(expandedProject);

    const result = undoHistory(historyStack, expandedProject, null);
    expect(result).not.toBeNull();

    const restoredLayer = result!.project.canvas.layers[0];
    expect(restoredLayer.type).toBe("drawing");
    if (restoredLayer.type !== "drawing") return;

    expect(restoredLayer.width).toBe(32);
    expect(restoredLayer.height).toBe(32);
    expect(restoredLayer.position).toEqual({ x: 0, y: 0 });
    expect(restoredLayer.pixels.length).toBe(32 * 32);
    expect(restoredLayer.pixels[0]).toBe(rgba(255, 0, 0, 255));

    expect(() => getCompositeGrid(result!.project)).not.toThrow();
  });

  it("captureEditorSnapshot includes layer geometry", () => {
    const layer = {
      ...createEmptyDrawingLayer({ width: 32, height: 24 }),
      position: { x: 5, y: 3 },
    };
    const project = createEmptyProject("test", { width: 64, height: 64 });
    project.canvas.layers = [layer];
    project.canvas.activeLayerId = layer.id;

    const snapshot = captureEditorSnapshot(project, null);
    expect(snapshot?.kind).toBe("pixels");
    if (snapshot?.kind !== "pixels") return;

    expect(snapshot.width).toBe(32);
    expect(snapshot.height).toBe(24);
    expect(snapshot.position).toEqual({ x: 5, y: 3 });
    expect(snapshot.pixels.length).toBe(32 * 24);
  });

  it("undoes drawing on a previous layer after switching active layer", () => {
    const layerA = createEmptyDrawingLayer({ width: 4, height: 4 });
    const layerB = createEmptyDrawingLayer({ width: 4, height: 4 });
    layerA.pixels[0] = rgba(255, 0, 0, 255);

    const project = createEmptyProject("test", { width: 8, height: 8 });
    project.canvas.layers = [layerA, layerB];
    project.canvas.activeLayerId = layerA.id;

    const historyStack = new HistoryStack();
    pushHistory(historyStack, project, null);

    layerA.pixels[0] = rgba(0, 0, 255, 255);
    const afterDraw = {
      ...project,
      canvas: {
        ...project.canvas,
        layers: [layerA, layerB],
      },
    };

    const switched = {
      ...afterDraw,
      canvas: {
        ...afterDraw.canvas,
        activeLayerId: layerB.id,
      },
    };

    const result = undoHistory(historyStack, switched, null);
    expect(result).not.toBeNull();
    expect(result!.project.canvas.activeLayerId).toBe(layerA.id);

    const restoredA = result!.project.canvas.layers.find((l) => l.id === layerA.id);
    expect(restoredA?.type).toBe("drawing");
    if (restoredA?.type !== "drawing") return;
    expect(restoredA.pixels[0]).toBe(rgba(255, 0, 0, 255));
  });
});
