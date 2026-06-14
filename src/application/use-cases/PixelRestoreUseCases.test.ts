import { describe, expect, it, vi } from "vitest";
import type { PixelGrid } from "@/domain/canvas/PixelGrid";
import { PixelGrid as PG } from "@/domain/canvas/PixelGrid";
import type { IImageProcessor } from "@/application/ports/IImageProcessor";
import {
  analyzeSourceImage,
  applyFixedScaleRestore,
  loadSourceImageFromClipboard,
} from "./PixelRestoreUseCases";

vi.mock("@/infrastructure/image/PixelGridCodec", () => ({
  pixelGridToImageData: (grid: PixelGrid) =>
    ({ width: grid.width, height: grid.height }) as ImageData,
}));

function createImageData(width: number, height: number): ImageData {
  return { width, height } as ImageData;
}

function createMockProcessor(
  detectedScale: number,
  downscaleImpl?: (imageData: ImageData, scale: number) => PixelGrid,
): IImageProcessor {
  return {
    loadImageFromPath: vi.fn(),
    loadImageFromFile: vi.fn(),
    detectScale: vi.fn(() => detectedScale),
    downscale: vi.fn(
      downscaleImpl ??
        ((imageData, scale) =>
          PG.createEmpty(
            Math.floor(imageData.width / scale),
            Math.floor(imageData.height / scale),
          )),
    ),
    extractPalette: vi.fn(),
    processImage: vi.fn(),
  };
}

describe("PixelRestoreUseCases", () => {
  it("analyzes source image and picks default scale from detection", () => {
    const imageData = createImageData(128, 96);
    const processor = createMockProcessor(4);
    const analysis = analyzeSourceImage(processor, imageData);
    expect(analysis.detectedScale).toBe(4);
    expect(analysis.defaultScale).toBe(4);
  });

  it("falls back default scale when detection is invalid", () => {
    const imageData = createImageData(128, 96);
    const processor = createMockProcessor(5);
    const analysis = analyzeSourceImage(processor, imageData);
    expect(analysis.defaultScale).toBe(2);
  });

  it("applies fixed scale restore and returns image data", () => {
    const imageData = createImageData(128, 96);
    const processor = createMockProcessor(4);
    const result = applyFixedScaleRestore(processor, imageData, 4);
    expect(result.appliedScale).toBe(4);
    expect(result.outputSize).toEqual({ width: 32, height: 24 });
    expect(result.resultImageData.width).toBe(32);
    expect(result.resultImageData.height).toBe(24);
    expect(processor.downscale).toHaveBeenCalledWith(imageData, 4);
  });

  it("applies scale 1 without changing dimensions", () => {
    const imageData = createImageData(128, 96);
    const processor = createMockProcessor(4);
    const result = applyFixedScaleRestore(processor, imageData, 1);
    expect(result.appliedScale).toBe(1);
    expect(result.outputSize).toEqual({ width: 128, height: 96 });
    expect(result.resultImageData.width).toBe(128);
    expect(result.resultImageData.height).toBe(96);
    expect(processor.downscale).toHaveBeenCalledWith(imageData, 1);
  });

  it("throws when scale does not divide source dimensions", () => {
    const imageData = createImageData(128, 96);
    const processor = createMockProcessor(4);
    expect(() => applyFixedScaleRestore(processor, imageData, 5)).toThrow(
      /not evenly divisible/,
    );
  });

  it("loads image from clipboard", async () => {
    const imageData = createImageData(64, 64);
    const clipboard = {
      copyImage: vi.fn(),
      readImage: vi.fn(async () => imageData),
    };
    await expect(loadSourceImageFromClipboard(clipboard)).resolves.toBe(imageData);
  });

  it("throws when clipboard has no image", async () => {
    const clipboard = {
      copyImage: vi.fn(),
      readImage: vi.fn(async () => null),
    };
    await expect(loadSourceImageFromClipboard(clipboard)).rejects.toThrow(
      /剪贴板中没有图像/,
    );
  });
});
