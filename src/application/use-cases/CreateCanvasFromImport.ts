import { encodeImageDataToPngBase64 } from "@/infrastructure/image/ImageDataCodec";
import { createProjectFromImage } from "@/domain/project/Project";
import type { Project } from "@/domain/project/Project";
import { Palette } from "@/domain/palette/Palette";
import type { IImageProcessor } from "../ports/IImageProcessor";

export interface ImportResult {
  project: Project;
  detectedScale: number;
}

export async function createCanvasFromImport(
  imageProcessor: IImageProcessor,
  file: File,
  projectName: string,
  manualScale?: number,
): Promise<ImportResult> {
  const imageData = await imageProcessor.loadImageFromFile(file);
  const result = imageProcessor.processImage(imageData, manualScale);
  const base64 = encodeImageDataToPngBase64(imageData);
  return {
    project: createProjectFromImage(
      projectName,
      { width: result.grid.width, height: result.grid.height },
      {
        imageData: base64,
        imageSize: { width: imageData.width, height: imageData.height },
      },
      result.appliedScale,
      Palette.empty(),
    ),
    detectedScale: result.detectedScale,
  };
}

export async function createCanvasFromImagePath(
  imageProcessor: IImageProcessor,
  path: string,
  projectName: string,
  manualScale?: number,
): Promise<ImportResult> {
  const imageData = await imageProcessor.loadImageFromPath(path);
  const result = imageProcessor.processImage(imageData, manualScale);
  const base64 = encodeImageDataToPngBase64(imageData);
  return {
    project: createProjectFromImage(
      projectName,
      { width: result.grid.width, height: result.grid.height },
      {
        imageData: base64,
        imageSize: { width: imageData.width, height: imageData.height },
      },
      result.appliedScale,
      Palette.empty(),
    ),
    detectedScale: result.detectedScale,
  };
}
