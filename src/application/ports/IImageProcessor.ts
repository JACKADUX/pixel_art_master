import type { PixelGrid } from "@/domain/canvas/PixelGrid";
import type { Palette } from "@/domain/palette/Palette";

export interface DownscaleResult {
  grid: PixelGrid;
  detectedScale: number;
  appliedScale: number;
}

export interface IImageProcessor {
  loadImageFromPath(path: string): Promise<ImageData>;
  loadImageFromFile(file: File): Promise<ImageData>;
  detectScale(imageData: ImageData): number;
  downscale(imageData: ImageData, scale: number): PixelGrid;
  extractPalette(...grids: PixelGrid[]): Palette;
  processImage(imageData: ImageData, manualScale?: number): DownscaleResult;
}
