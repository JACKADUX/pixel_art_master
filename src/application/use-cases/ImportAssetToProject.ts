import type { PixelGrid } from "@/domain/canvas/PixelGrid";
import { createDrawingLayer } from "@/domain/layer/Layer";
import { extractUniqueColorsFromPixels } from "@/domain/layer/ReferenceLayerPalette";
import { touchProject, type Project } from "@/domain/project/Project";import {
  importImageDataToReferenceLayer,
  type ImportToReferenceLayerResult,
} from "./ImportToReferenceLayer";

export function importAssetGridToNewDrawingLayer(
  project: Project,
  assetGrid: PixelGrid,
  layerName?: string,
): Project {
  const drawingLayer = createDrawingLayer(assetGrid, layerName);
  const layers = [...project.canvas.layers, drawingLayer];
  return touchProject({
    ...project,
    canvas: {
      ...project.canvas,
      layers,
      activeLayerId: drawingLayer.id,
    },
  });
}

export function importAssetImageDataToNewReferenceLayer(
  project: Project,
  imageData: ImageData,
  layerName?: string,
): ImportToReferenceLayerResult {
  return importImageDataToReferenceLayer(
    project,
    imageData,
    layerName ?? "参考图",
    null,
  );
}

export function importAssetColorsToPalette(
  project: Project,
  assetGrid: PixelGrid,
): { project: Project; addedCount: number } {
  const colors = extractUniqueColorsFromPixels(assetGrid.toUint32Array());
  if (colors.length === 0) {
    return { project, addedCount: 0 };
  }

  const beforeCount = project.palette.getColors().length;
  const nextPalette = project.palette.withAddedColors(colors);
  const addedCount = nextPalette.getColors().length - beforeCount;

  return {
    project: touchProject({ ...project, palette: nextPalette }),
    addedCount,
  };
}
