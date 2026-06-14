import type { PixelGrid } from "../canvas/PixelGrid";
import { extractUniqueColorsFromPixels } from "../layer/ReferenceLayerPalette";

export interface AssetMetadata {
  width: number;
  height: number;
  colorCount: number;
}

export function metadataFromPixelGrid(grid: PixelGrid): AssetMetadata {
  return {
    width: grid.width,
    height: grid.height,
    colorCount: extractUniqueColorsFromPixels(grid.toUint32Array()).length,
  };
}

export function metadataFromImageData(imageData: ImageData): AssetMetadata {
  const pixels = new Uint32Array(imageData.width * imageData.height);
  const data = imageData.data;
  for (let i = 0; i < pixels.length; i++) {
    const offset = i * 4;
    const r = data[offset];
    const g = data[offset + 1];
    const b = data[offset + 2];
    const a = data[offset + 3];
    pixels[i] =
      ((a & 0xff) << 24) | ((b & 0xff) << 16) | ((g & 0xff) << 8) | (r & 0xff);
  }
  return {
    width: imageData.width,
    height: imageData.height,
    colorCount: extractUniqueColorsFromPixels(pixels).length,
  };
}

export function formatAssetDefaultTitle(): string {
  return new Date().toLocaleString();
}
