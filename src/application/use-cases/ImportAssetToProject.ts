import type { PixelGrid } from "@/domain/canvas/PixelGrid";
import { createDrawingLayer, type LayerPosition } from "@/domain/layer/Layer";
import { extractUniqueColorsFromPixels } from "@/domain/layer/ReferenceLayerPalette";
import {
  getActiveCanvas,
  resolveProjectCanvas,
  touchProject,
  withActiveCanvasId,
  withActiveLayerId,
  type Project,
} from "@/domain/project/Project";
import {
  importImageDataToReferenceLayer,
  type ImportToReferenceLayerResult,
} from "./ImportToReferenceLayer";

export function importAssetGridToNewDrawingLayer(
  project: Project,
  assetGrid: PixelGrid,
  layerName?: string,
): Project {
  return importAssetGridToNewDrawingLayerAtPosition(
    project,
    assetGrid,
    getActiveCanvas(project).id,
    { x: 0, y: 0 },
    layerName,
  );
}

export function importAssetGridToNewDrawingLayerAtPosition(
  project: Project,
  assetGrid: PixelGrid,
  canvasId: string,
  position: LayerPosition,
  layerName?: string,
): Project {
  const canvas = resolveProjectCanvas(project, canvasId);
  if (!canvas) {
    throw new Error(`Canvas not found: ${canvasId}`);
  }

  const drawingLayer = createDrawingLayer(assetGrid, layerName, position);
  const layers = [...canvas.layers, drawingLayer];

  return withActiveLayerId(
    withActiveCanvasId(
      touchProject({
        ...project,
        board: {
          ...project.board,
          canvases: project.board.canvases.map((entry) =>
            entry.id === canvasId
              ? { ...entry, layers, activeLayerId: drawingLayer.id }
              : entry,
          ),
        },
      }),
      canvasId,
    ),
    drawingLayer.id,
    canvasId,
  );
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
