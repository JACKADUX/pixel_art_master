import { encodeImageDataToPngBase64 } from "@/infrastructure/image/ImageDataCodec";
import { createEmptyReferenceLayer } from "@/domain/layer/Layer";
import {
  setReferenceImage,
  updateReferenceLayer,
} from "@/domain/layer/ReferenceLayerOperations";
import {
  getCanvasSize,
  getLayerById,
  touchProject,
  withLayers,
  type Project,
} from "@/domain/project/Project";
import type { ICaptureService } from "../ports/ICaptureService";
import type { IImageProcessor } from "../ports/IImageProcessor";

export interface ImportToReferenceLayerResult {
  project: Project;
  layerId: string;
  openCropEditor: boolean;
}

function applyImageToReferenceLayer(
  project: Project,
  targetLayerId: string | null,
  imageData: ImageData,
  layerName: string,
): ImportToReferenceLayerResult {
  const canvasSize = getCanvasSize(project);
  const base64 = encodeImageDataToPngBase64(imageData);
  const imageSize = { width: imageData.width, height: imageData.height };

  const existing = targetLayerId ? getLayerById(project, targetLayerId) : undefined;

  if (existing?.type === "reference") {
    const layers = updateReferenceLayer(project.canvas.layers, targetLayerId!, (ref) =>
      setReferenceImage(ref, base64, imageSize, canvasSize),
    );
    return {
      project: touchProject(withLayers(project, layers)),
      layerId: targetLayerId!,
      openCropEditor: true,
    };
  }

  const newRef = setReferenceImage(
    createEmptyReferenceLayer(layerName),
    base64,
    imageSize,
    canvasSize,
  );
  const layers = [newRef, ...project.canvas.layers];

  return {
    project: touchProject(withLayers(project, layers)),
    layerId: newRef.id,
    openCropEditor: true,
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
