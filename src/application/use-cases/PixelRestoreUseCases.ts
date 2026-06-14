import type { PixelGrid } from "@/domain/canvas/PixelGrid";
import {
  resolveDefaultRestoreScale,
  validateFixedScaleRestore,
  type ImageDimensions,
  type RestoreOutputSize,
} from "@/domain/pixelRestore/FixedScaleRestoreOperations";
import { createRestoreScale } from "@/domain/pixelRestore/RestoreScale";
import { pixelGridToImageData } from "@/infrastructure/image/PixelGridCodec";
import type { ICaptureService } from "../ports/ICaptureService";
import type { IClipboardService } from "../ports/IClipboardService";
import type { IImageProcessor } from "../ports/IImageProcessor";

export interface PixelRestoreAnalysis {
  detectedScale: number;
  defaultScale: number;
}

export interface FixedScaleRestoreResult {
  grid: PixelGrid;
  resultImageData: ImageData;
  appliedScale: number;
  outputSize: RestoreOutputSize;
}

export function analyzeSourceImage(
  imageProcessor: IImageProcessor,
  imageData: ImageData,
): PixelRestoreAnalysis {
  const source: ImageDimensions = {
    width: imageData.width,
    height: imageData.height,
  };
  const detectedScale = imageProcessor.detectScale(imageData);
  const defaultScale = resolveDefaultRestoreScale(detectedScale, source);
  return { detectedScale, defaultScale };
}

export function applyFixedScaleRestore(
  imageProcessor: IImageProcessor,
  imageData: ImageData,
  scaleValue: number,
): FixedScaleRestoreResult {
  const scale = createRestoreScale(scaleValue);
  const source: ImageDimensions = {
    width: imageData.width,
    height: imageData.height,
  };
  const outputSize = validateFixedScaleRestore(source, scale);
  const grid = imageProcessor.downscale(imageData, scale.value);
  const resultImageData = pixelGridToImageData(grid);
  return {
    grid,
    resultImageData,
    appliedScale: scale.value,
    outputSize,
  };
}

export async function loadSourceImageFromFile(
  imageProcessor: IImageProcessor,
  file: File,
): Promise<ImageData> {
  return imageProcessor.loadImageFromFile(file);
}

export async function loadSourceImageFromPath(
  imageProcessor: IImageProcessor,
  path: string,
): Promise<ImageData> {
  return imageProcessor.loadImageFromPath(path);
}

export async function loadSourceImageFromClipboard(
  clipboard: IClipboardService,
): Promise<ImageData> {
  const imageData = await clipboard.readImage();
  if (!imageData) {
    throw new Error("剪贴板中没有图像");
  }
  return imageData;
}

export async function captureMonitorToImagePath(
  captureService: ICaptureService,
  monitorId: number,
): Promise<string> {
  try {
    await captureService.hideApp();
    return await captureService.captureMonitor(monitorId);
  } finally {
    await captureService.showApp();
  }
}
