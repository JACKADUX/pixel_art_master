import { describe, expect, it } from "vitest";
import {
  canvasToLayerPoint,
  computeExpandedLayerSize,
  drawingLayerContainsCanvasPoint,
  expandDrawingLayerForCanvasGrow,
  expandDrawingLayerToCoverCanvas,
  expandDrawingLayerToIncludeCanvasPoint,
  expandDrawingLayersForCanvasGrow,
  getDrawingLayerCanvasBounds,
  moveDrawingLayerPosition,
} from "./DrawingLayerOperations";
import { createEmptyDrawingLayer } from "./Layer";
import { getLayerGrid } from "./LayerOperations";
import { compositeDrawingLayers } from "./LayerCompositor";
import { wrapLayerOnCanvas } from "../canvas/LayerProjectedSurface";
import { rgba } from "../canvas/PixelColor";
import { resizeProjectCanvas } from "../project/Project";
import { createEmptyProject } from "../project/Project";

describe("DrawingLayerOperations", () => {
  it("maps canvas coordinates to layer-local coordinates", () => {
    expect(canvasToLayerPoint({ x: 5, y: 7 }, { x: 2, y: 3 })).toEqual({ x: 3, y: 4 });
  });

  it("moves layer position by delta", () => {
    const layer = createEmptyDrawingLayer({ width: 4, height: 4 });
    const moved = moveDrawingLayerPosition(layer, { x: 2, y: -1 });
    expect(moved.position).toEqual({ x: 2, y: -1 });
  });

  it("reports canvas bounds from position and size", () => {
    const layer = {
      ...createEmptyDrawingLayer({ width: 10, height: 8 }),
      position: { x: 3, y: 4 },
    };
    expect(getDrawingLayerCanvasBounds(layer)).toEqual({
      x: 3,
      y: 4,
      width: 10,
      height: 8,
    });
  });
});

describe("expandDrawingLayerForCanvasGrow", () => {
  it("expands layer to cover new canvas at origin", () => {
    const layer = createEmptyDrawingLayer({ width: 64, height: 64 });
    layer.pixels[0] = rgba(255, 0, 0, 255);

    const expanded = expandDrawingLayerForCanvasGrow(
      layer,
      { width: 64, height: 64 },
      { width: 96, height: 64 },
    );

    expect(expanded.width).toBe(96);
    expect(expanded.height).toBe(64);
    expect(expanded.position).toEqual({ x: 0, y: 0 });
    expect(expanded.pixels[0]).toBe(rgba(255, 0, 0, 255));
    expect(expanded.pixels.length).toBe(96 * 64);
  });

  it("respects non-zero position when computing target size", () => {
    const layer = {
      ...createEmptyDrawingLayer({ width: 64, height: 64 }),
      position: { x: 10, y: 5 },
    };

    expect(computeExpandedLayerSize(layer, { width: 80, height: 64 })).toEqual({
      width: 70,
      height: 64,
    });

    const expanded = expandDrawingLayerForCanvasGrow(
      layer,
      { width: 64, height: 64 },
      { width: 80, height: 64 },
    );

    expect(expanded.width).toBe(70);
    expect(expanded.height).toBe(64);
  });

  it("does not shrink layer when canvas shrinks", () => {
    const layer = createEmptyDrawingLayer({ width: 96, height: 64 });
    layer.pixels[0] = rgba(0, 255, 0, 255);

    const result = expandDrawingLayerForCanvasGrow(
      layer,
      { width: 96, height: 64 },
      { width: 64, height: 64 },
    );

    expect(result).toBe(layer);
    expect(result.width).toBe(96);
    expect(result.pixels.length).toBe(96 * 64);
  });

  it("expands all drawing layers and skips reference layers", () => {
    const drawingA = createEmptyDrawingLayer({ width: 32, height: 32 }, "A");
    const drawingB = createEmptyDrawingLayer({ width: 32, height: 32 }, "B");
    const reference = {
      id: "ref",
      name: "ref",
      type: "reference" as const,
      visible: true,
      imageData: null,
      imageSize: null,
      crop: null,
      position: { x: 0, y: 0 },
      grid: { primary: 16, secondary: 8, visible: false },
      scale: 1,
      paletteVisible: false,
    };

    const layers = expandDrawingLayersForCanvasGrow(
      [reference, drawingA, drawingB],
      { width: 32, height: 32 },
      { width: 48, height: 40 },
    );

    expect(layers[0]).toBe(reference);
    expect(layers[1].type).toBe("drawing");
    expect(layers[2].type).toBe("drawing");
    if (layers[1].type === "drawing" && layers[2].type === "drawing") {
      expect(layers[1].width).toBe(48);
      expect(layers[1].height).toBe(40);
      expect(layers[2].width).toBe(48);
      expect(layers[2].height).toBe(40);
    }
  });

  it("allows drawing in newly expanded canvas area via projected surface", () => {
    const project = createEmptyProject("test", { width: 64, height: 64 });
    const resized = resizeProjectCanvas(project, 96, 64);
    const layer = resized.canvas.layers.find((entry) => entry.type === "drawing");
    expect(layer?.type).toBe("drawing");
    if (layer?.type !== "drawing") return;

    const grid = getLayerGrid(layer);
    const surface = wrapLayerOnCanvas(grid, layer.position, { width: 96, height: 64 });
    surface.setPixel(80, 10, rgba(0, 0, 255, 255));
    expect(surface.getPixel(80, 10)).toBe(rgba(0, 0, 255, 255));
  });
});

describe("expandDrawingLayerToIncludeCanvasPoint", () => {
  it("expands right and bottom when drawing beyond layer bounds", () => {
    const layer = createEmptyDrawingLayer({ width: 32, height: 32 });
    const expanded = expandDrawingLayerToIncludeCanvasPoint(layer, { x: 40, y: 35 });

    expect(expanded.width).toBe(41);
    expect(expanded.height).toBe(36);
    expect(expanded.position).toEqual({ x: 0, y: 0 });
    expect(drawingLayerContainsCanvasPoint(expanded, { x: 40, y: 35 })).toBe(true);
  });

  it("expands left and top when layer is offset on canvas", () => {
    const layer = {
      ...createEmptyDrawingLayer({ width: 16, height: 16 }),
      position: { x: 10, y: 10 },
    };
    const expanded = expandDrawingLayerToIncludeCanvasPoint(layer, { x: 5, y: 8 });

    expect(expanded.position).toEqual({ x: 5, y: 8 });
    expect(expanded.width).toBe(21);
    expect(expanded.height).toBe(18);
    expect(drawingLayerContainsCanvasPoint(expanded, { x: 5, y: 8 })).toBe(true);
  });

  it("covers entire canvas for fill operations", () => {
    const layer = {
      ...createEmptyDrawingLayer({ width: 16, height: 16 }),
      position: { x: 20, y: 20 },
    };
    const expanded = expandDrawingLayerToCoverCanvas(layer, { width: 64, height: 48 });

    expect(drawingLayerContainsCanvasPoint(expanded, { x: 0, y: 0 })).toBe(true);
    expect(drawingLayerContainsCanvasPoint(expanded, { x: 63, y: 47 })).toBe(true);
  });

  it("preserves existing pixels when expanding", () => {
    const layer = createEmptyDrawingLayer({ width: 4, height: 4 });
    layer.pixels[1 * layer.width + 1] = rgba(255, 0, 0, 255);

    const expanded = expandDrawingLayerToIncludeCanvasPoint(layer, { x: 8, y: 2 });
    expect(expanded.pixels[1 * expanded.width + 1]).toBe(rgba(255, 0, 0, 255));
  });
});

describe("compositeDrawingLayers with offset", () => {
  it("composites layer pixels at layer position and clips to canvas", () => {
    const layer = createEmptyDrawingLayer({ width: 4, height: 4 });
    layer.pixels[1 * layer.width + 1] = rgba(255, 0, 0, 255);

    const offsetLayer = {
      ...layer,
      position: { x: 2, y: 1 },
    };

    const composite = compositeDrawingLayers([offsetLayer], { width: 4, height: 4 });
    expect(composite.getPixel(3, 2)).toBe(rgba(255, 0, 0, 255));
    expect(composite.getPixel(1, 1)).toBe(0);
  });
});
