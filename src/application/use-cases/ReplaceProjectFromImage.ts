import type { Project } from "@/domain/project/Project";
import type { ICaptureService } from "../ports/ICaptureService";
import type { IImageProcessor } from "../ports/IImageProcessor";
import {
  importToReferenceLayerFromPath,
  importToReferenceLayerFromScreenCapture,
  importToReferenceLayerFromWindowCapture,
  type ImportToReferenceLayerResult,
} from "./ImportToReferenceLayer";

export type ReplaceProjectResult = ImportToReferenceLayerResult;

export async function replaceProjectFromImagePath(
  _repository: unknown,
  currentProject: Project,
  imageProcessor: IImageProcessor,
  imagePath: string,
  layerName: string,
  _promptSaveAs?: unknown,
  _manualScale?: number,
  targetLayerId?: string | null,
): Promise<ReplaceProjectResult | null> {
  return importToReferenceLayerFromPath(
    currentProject,
    imageProcessor,
    imagePath,
    layerName,
    targetLayerId,
  );
}

export async function replaceProjectFromScreenCapture(
  _repository: unknown,
  currentProject: Project,
  captureService: ICaptureService,
  imageProcessor: IImageProcessor,
  monitorId: number,
  layerName: string,
  _promptSaveAs?: unknown,
  _manualScale?: number,
  targetLayerId?: string | null,
): Promise<ReplaceProjectResult | null> {
  return importToReferenceLayerFromScreenCapture(
    currentProject,
    captureService,
    imageProcessor,
    monitorId,
    layerName,
    targetLayerId,
  );
}

export async function replaceProjectFromWindowCapture(
  _repository: unknown,
  currentProject: Project,
  captureService: ICaptureService,
  imageProcessor: IImageProcessor,
  windowId: number,
  layerName: string,
  _promptSaveAs?: unknown,
  _manualScale?: number,
  targetLayerId?: string | null,
): Promise<ReplaceProjectResult | null> {
  return importToReferenceLayerFromWindowCapture(
    currentProject,
    captureService,
    imageProcessor,
    windowId,
    layerName,
    targetLayerId,
  );
}
