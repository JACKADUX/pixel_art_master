import type { PixelGrid } from "@/domain/canvas/PixelGrid";
import { Palette } from "@/domain/palette/Palette";
import type {
  DownscaleResult,
  IImageProcessor,
} from "@/application/ports/IImageProcessor";
import { convertFileSrc } from "@tauri-apps/api/core";
import { readFile } from "@tauri-apps/plugin-fs";
import { detectPixelScale, downscaleImage } from "./PixelDownscaler";
import { extractPaletteFromGrids } from "./PaletteExtractor";

async function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function imageToImageData(img: HTMLImageElement): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas context");
  ctx.drawImage(img, 0, 0);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

async function loadImageViaFs(path: string): Promise<ImageData> {
  const bytes = await readFile(path);
  const blob = new Blob([bytes], { type: "image/png" });
  const url = URL.createObjectURL(blob);
  try {
    const img = await loadImageElement(url);
    return imageToImageData(img);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export class CanvasImageProcessor implements IImageProcessor {
  async loadImageFromPath(path: string): Promise<ImageData> {
    try {
      const src = convertFileSrc(path);
      const img = await loadImageElement(src);
      return imageToImageData(img);
    } catch {
      return loadImageViaFs(path);
    }
  }

  async loadImageFromFile(file: File): Promise<ImageData> {
    const url = URL.createObjectURL(file);
    try {
      const img = await loadImageElement(url);
      return imageToImageData(img);
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  detectScale(imageData: ImageData): number {
    return detectPixelScale(imageData);
  }

  downscale(imageData: ImageData, scale: number): PixelGrid {
    const applied = Math.max(1, scale);
    return downscaleImage(imageData, applied);
  }

  extractPalette(...grids: PixelGrid[]): Palette {
    return extractPaletteFromGrids(...grids);
  }

  processImage(imageData: ImageData, manualScale?: number): DownscaleResult {
    const detectedScale = this.detectScale(imageData);
    const appliedScale = manualScale ?? detectedScale;
    const grid = this.downscale(imageData, appliedScale);
    return { grid, detectedScale, appliedScale };
  }
}

export const imageProcessor = new CanvasImageProcessor();
