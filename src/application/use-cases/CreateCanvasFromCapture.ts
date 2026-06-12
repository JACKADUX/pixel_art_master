import { Palette } from "@/domain/palette/Palette";
import { createProjectFromImage } from "@/domain/project/Project";
import type { Project } from "@/domain/project/Project";
import type { ICaptureService } from "../ports/ICaptureService";
import type { IImageProcessor } from "../ports/IImageProcessor";

export interface CaptureResult {
  project: Project;
  detectedScale: number;
}

export async function createCanvasFromScreenCapture(
  captureService: ICaptureService,
  imageProcessor: IImageProcessor,
  monitorId: number,
  projectName: string,
  manualScale?: number,
): Promise<CaptureResult> {
  try {
    await captureService.hideApp();
    const imagePath = await captureService.captureMonitor(monitorId);
    const imageData = await imageProcessor.loadImageFromPath(imagePath);
    const result = imageProcessor.processImage(imageData, manualScale);
    return {
      project: createProjectFromImage(
        projectName,
        result.grid,
        result.appliedScale,
        Palette.empty(),
      ),
      detectedScale: result.detectedScale,
    };
  } finally {
    await captureService.showApp();
  }
}

export async function createCanvasFromWindowCapture(
  captureService: ICaptureService,
  imageProcessor: IImageProcessor,
  windowId: number,
  projectName: string,
  manualScale?: number,
): Promise<CaptureResult> {
  try {
    await captureService.hideApp();
    const imagePath = await captureService.captureWindow(windowId);
    const imageData = await imageProcessor.loadImageFromPath(imagePath);
    const result = imageProcessor.processImage(imageData, manualScale);
    return {
      project: createProjectFromImage(
        projectName,
        result.grid,
        result.appliedScale,
        Palette.empty(),
      ),
      detectedScale: result.detectedScale,
    };
  } finally {
    await captureService.showApp();
  }
}
