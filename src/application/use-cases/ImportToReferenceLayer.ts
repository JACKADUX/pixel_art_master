import type { PixelGrid } from "@/domain/canvas/PixelGrid";
import { createLayer } from "@/domain/layer/Layer";
import { getLayerGrid, resizeAllLayers } from "@/domain/layer/LayerOperations";
import {
  getCanvasSize,
  touchProject,
  withCanvasSize,
  withLayers,
  type Project,
} from "@/domain/project/Project";
import { extractPaletteFromGrids } from "@/infrastructure/image/PaletteExtractor";
import type { ICaptureService } from "../ports/ICaptureService";
import type { IImageProcessor } from "../ports/IImageProcessor";

export interface ImportToReferenceLayerResult {
  project: Project;
  detectedScale: number;
}

function applyReferenceLayerToProject(
  project: Project,
  grid: PixelGrid,
  layerName: string,
  appliedScale: number,
): Project {
  const oldSize = getCanvasSize(project);
  const newSize = { width: grid.width, height: grid.height };

  let layers = project.canvas.layers;
  if (oldSize.width !== newSize.width || oldSize.height !== newSize.height) {
    layers = resizeAllLayers(layers, oldSize, newSize);
  }

  const referenceLayer = createLayer("reference", grid, layerName);
  layers = [referenceLayer, ...layers];

  const grids = layers.map((l) => getLayerGrid(l, newSize));

  let updated = withLayers(project, layers);
  updated = withCanvasSize(updated, newSize.width, newSize.height);
  updated = {
    ...updated,
    canvas: {
      ...updated.canvas,
      scaleFactor: appliedScale,
    },
    palette: extractPaletteFromGrids(...grids),
  };

  return touchProject(updated);
}

export async function importToReferenceLayerFromPath(
  project: Project,
  imageProcessor: IImageProcessor,
  imagePath: string,
  layerName: string,
  manualScale?: number,
): Promise<ImportToReferenceLayerResult> {
  const imageData = await imageProcessor.loadImageFromPath(imagePath);
  const result = imageProcessor.processImage(imageData, manualScale);
  const updated = applyReferenceLayerToProject(
    project,
    result.grid,
    layerName,
    result.appliedScale,
  );
  return { project: updated, detectedScale: result.detectedScale };
}

export async function importToReferenceLayerFromScreenCapture(
  project: Project,
  captureService: ICaptureService,
  imageProcessor: IImageProcessor,
  monitorId: number,
  layerName: string,
  manualScale?: number,
): Promise<ImportToReferenceLayerResult> {
  try {
    await captureService.hideApp();
    const imagePath = await captureService.captureMonitor(monitorId);
    return importToReferenceLayerFromPath(
      project,
      imageProcessor,
      imagePath,
      layerName,
      manualScale,
    );
  } finally {
    await captureService.showApp();
  }
}

export async function importToReferenceLayerFromWindowCapture(
  project: Project,
  captureService: ICaptureService,
  imageProcessor: IImageProcessor,
  windowId: number,
  layerName: string,
  manualScale?: number,
): Promise<ImportToReferenceLayerResult> {
  try {
    await captureService.hideApp();
    const imagePath = await captureService.captureWindow(windowId);
    return importToReferenceLayerFromPath(
      project,
      imageProcessor,
      imagePath,
      layerName,
      manualScale,
    );
  } finally {
    await captureService.showApp();
  }
}
