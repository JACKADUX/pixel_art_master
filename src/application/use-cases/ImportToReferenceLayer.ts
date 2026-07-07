import { encodeImageDataToPngBase64 } from "@/infrastructure/image/ImageDataCodec";
import { createEmptyReferenceLayer, type LayerPosition } from "@/domain/layer/Layer";
import {
  setReferenceImage,
  setReferencePosition,
  updateReferenceLayer,
} from "@/domain/layer/ReferenceLayerOperations";
import { isReferenceLayer } from "@/domain/layer/LayerTypeGuards";
import {
  getActiveCanvas,
  getCanvasSize,
  getLayerById,
  resolveProjectCanvas,
  touchProject,
  withActiveReferenceLayerId,
  type Project,
} from "@/domain/project/Project";
import type { ICaptureService } from "../ports/ICaptureService";
import type { IImageProcessor } from "../ports/IImageProcessor";

export interface ImportToReferenceLayerResult {
  project: Project;
  layerId: string;
  openCropEditor: boolean;
}

interface ApplyReferenceLayerOptions {
  boardPosition?: LayerPosition;
  canvasId?: string;
  openCropEditor?: boolean;
}

export function importImageDataToReferenceLayer(
  project: Project,
  imageData: ImageData,
  layerName: string,
  targetLayerId?: string | null,
): ImportToReferenceLayerResult {
  return applyImageToReferenceLayer(
    project,
    targetLayerId ?? null,
    imageData,
    layerName,
  );
}

export function importImageDataToReferenceLayerAtBoardPosition(
  project: Project,
  imageData: ImageData,
  layerName: string,
  boardPosition: LayerPosition,
  canvasId: string,
): ImportToReferenceLayerResult {
  return applyImageToReferenceLayer(project, null, imageData, layerName, {
    boardPosition,
    canvasId,
    openCropEditor: false,
  });
}

function applyImageToReferenceLayer(
  project: Project,
  targetLayerId: string | null,
  imageData: ImageData,
  layerName: string,
  options?: ApplyReferenceLayerOptions,
): ImportToReferenceLayerResult {
  const targetCanvasId = options?.canvasId ?? getActiveCanvas(project).id;
  const targetCanvas = resolveProjectCanvas(project, targetCanvasId);
  if (!targetCanvas) {
    throw new Error(`Canvas not found: ${targetCanvasId}`);
  }

  const canvasSize = getCanvasSize(project, targetCanvasId);
  const canvasBoardPosition = targetCanvas.boardPosition;
  const base64 = encodeImageDataToPngBase64(imageData);
  const imageSize = { width: imageData.width, height: imageData.height };
  const openCropEditor = options?.openCropEditor ?? true;

  const existing = targetLayerId ? getLayerById(project, targetLayerId) : undefined;

  if (existing?.type === "reference") {
    const referenceLayers = updateReferenceLayer(
      project.referenceLayers,
      targetLayerId!,
      (ref) => {
        let next = setReferenceImage(ref, base64, imageSize, canvasSize, canvasBoardPosition);
        if (options?.boardPosition) {
          next = setReferencePosition(next, options.boardPosition);
        }
        return next;
      },
    ).filter(isReferenceLayer);
    return {
      project: touchProject({ ...project, referenceLayers }),
      layerId: targetLayerId!,
      openCropEditor,
    };
  }

  let newRef = setReferenceImage(
    createEmptyReferenceLayer(layerName),
    base64,
    imageSize,
    canvasSize,
    canvasBoardPosition,
  );
  if (options?.boardPosition) {
    newRef = setReferencePosition(newRef, options.boardPosition);
  }

  return {
    project: touchProject(
      withActiveReferenceLayerId(
        { ...project, referenceLayers: [newRef, ...project.referenceLayers] },
        newRef.id,
      ),
    ),
    layerId: newRef.id,
    openCropEditor,
  };
}

export async function importToReferenceLayerFromPath(
  project: Project,
  imageProcessor: IImageProcessor,
  imagePath: string,
  layerName: string,
  targetLayerId?: string | null,
): Promise<ImportToReferenceLayerResult> {
  const imageData = await imageProcessor.loadImageFromPath(imagePath);
  return applyImageToReferenceLayer(
    project,
    targetLayerId ?? null,
    imageData,
    layerName,
  );
}

export async function importToReferenceLayerFromScreenCapture(
  project: Project,
  captureService: ICaptureService,
  imageProcessor: IImageProcessor,
  monitorId: number,
  layerName: string,
  targetLayerId?: string | null,
): Promise<ImportToReferenceLayerResult> {
  try {
    await captureService.hideApp();
    const imagePath = await captureService.captureMonitor(monitorId);
    return importToReferenceLayerFromPath(
      project,
      imageProcessor,
      imagePath,
      layerName,
      targetLayerId,
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
  targetLayerId?: string | null,
): Promise<ImportToReferenceLayerResult> {
  try {
    await captureService.hideApp();
    const imagePath = await captureService.captureWindow(windowId);
    return importToReferenceLayerFromPath(
      project,
      imageProcessor,
      imagePath,
      layerName,
      targetLayerId,
    );
  } finally {
    await captureService.showApp();
  }
}
