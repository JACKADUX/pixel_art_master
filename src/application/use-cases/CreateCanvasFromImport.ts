import { createProjectFromImage } from "@/domain/project/Project";
import type { Project } from "@/domain/project/Project";
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
  return {
    project: createProjectFromImage(
      projectName,
      result.grid,
      result.appliedScale,
      imageProcessor.extractPalette(result.grid),
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
  return {
    project: createProjectFromImage(
      projectName,
      result.grid,
      result.appliedScale,
      imageProcessor.extractPalette(result.grid),
    ),
    detectedScale: result.detectedScale,
  };
}
