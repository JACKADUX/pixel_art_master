import { describe, expect, it } from "vitest";
import { PixelGrid } from "@/domain/canvas/PixelGrid";
import { rgba } from "@/domain/canvas/PixelColor";
import { createEmptyProject } from "@/domain/project/Project";
import { getActiveLayer } from "@/domain/project/Project";
import { isDrawingLayer } from "@/domain/layer/LayerTypeGuards";
import {
  syncActiveLayerPixels,
  toggleDrawingLayerLockInProject,
} from "./LayerUseCases";

describe("LayerUseCases lock guards", () => {
  it("does not sync pixels when active drawing layer is locked", () => {
    const project = createEmptyProject("test", { width: 4, height: 4 });
    const activeLayer = getActiveLayer(project);
    expect(isDrawingLayer(activeLayer)).toBe(true);
    if (!isDrawingLayer(activeLayer)) return;

    const lockedProject = toggleDrawingLayerLockInProject(project, activeLayer.id);
    const grid = PixelGrid.createEmpty(activeLayer.width, activeLayer.height);
    grid.setPixel(0, 0, rgba(255, 0, 0));

    const result = syncActiveLayerPixels(lockedProject, grid);
    const resultLayer = getActiveLayer(result);
    expect(isDrawingLayer(resultLayer)).toBe(true);
    if (isDrawingLayer(resultLayer)) {
      expect(resultLayer.pixels[0]).toBe(0);
    }
  });
});
