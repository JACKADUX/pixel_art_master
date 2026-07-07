import { describe, expect, it } from "vitest";
import { createEmptyProject } from "@/domain/project/Project";
import { getActiveCanvas, getCanvasSize } from "@/domain/project/Project";
import { CompositeCache, compositeActiveLayerOverBase } from "./CompositeCache";
import { getLayerGrid } from "./LayerOperations";
import { isDrawingLayer } from "./LayerTypeGuards";
import { rgba } from "../canvas/PixelColor";

describe("CompositeCache", () => {
  it("reuses cached layers below the active layer", () => {
    const project = createEmptyProject("test", { width: 8, height: 8 });
    const cache = new CompositeCache();
    const canvas = getActiveCanvas(project);
    const size = getCanvasSize(project, canvas.id);
    const activeIndex = canvas.layers.findIndex((layer) => layer.id === canvas.activeLayerId);

    const first = cache.getBelowActiveLayers(canvas.layers, size, activeIndex);
    const second = cache.getBelowActiveLayers(canvas.layers, size, activeIndex);
    expect(first).toBe(second);
  });

  it("composites active layer over cached base", () => {
    const project = createEmptyProject("test", { width: 4, height: 4 });
    const cache = new CompositeCache();
    const canvas = getActiveCanvas(project);
    const size = getCanvasSize(project, canvas.id);
    const activeLayer = canvas.layers.find((layer) => layer.id === canvas.activeLayerId);
    expect(activeLayer && isDrawingLayer(activeLayer)).toBe(true);
    if (!activeLayer || !isDrawingLayer(activeLayer)) return;

    const activeIndex = canvas.layers.findIndex((layer) => layer.id === activeLayer.id);
    const base = cache.getBelowActiveLayers(canvas.layers, size, activeIndex);
    const grid = getLayerGrid(activeLayer);
    grid.setPixel(1, 1, rgba(255, 0, 0, 255));

    const composite = compositeActiveLayerOverBase(
      base,
      grid,
      activeLayer.position,
      activeLayer.opacity,
    );
    expect(composite.getPixel(1, 1)).toBe(rgba(255, 0, 0, 255));
  });
});
