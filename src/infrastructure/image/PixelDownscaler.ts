import { PixelGrid } from "@/domain/canvas/PixelGrid";

const TOLERANCE = 0.05;

function blockIsUniform(
  data: Uint8ClampedArray,
  width: number,
  x: number,
  y: number,
  scale: number,
): boolean {
  const refOffset = (y * width + x) * 4;
  const refR = data[refOffset];
  const refG = data[refOffset + 1];
  const refB = data[refOffset + 2];
  const refA = data[refOffset + 3];
  let mismatches = 0;
  let total = 0;

  for (let dy = 0; dy < scale; dy++) {
    for (let dx = 0; dx < scale; dx++) {
      const px = x + dx;
      const py = y + dy;
      if (px >= width || py >= Math.floor(data.length / 4 / width)) continue;
      const offset = (py * width + px) * 4;
      total++;
      if (
        data[offset] !== refR ||
        data[offset + 1] !== refG ||
        data[offset + 2] !== refB ||
        data[offset + 3] !== refA
      ) {
        mismatches++;
      }
    }
  }

  return total > 0 && mismatches / total <= TOLERANCE;
}

export function detectPixelScale(imageData: ImageData): number {
  const { width, height, data } = imageData;
  const maxScale = Math.min(Math.floor(width / 2), Math.floor(height / 2), 16);
  let bestScale = 1;

  for (let scale = maxScale; scale >= 2; scale--) {
    if (width % scale !== 0 || height % scale !== 0) continue;

    let validBlocks = 0;
    let totalBlocks = 0;

    for (let y = 0; y < height; y += scale) {
      for (let x = 0; x < width; x += scale) {
        totalBlocks++;
        if (blockIsUniform(data, width, x, y, scale)) {
          validBlocks++;
        }
      }
    }

    if (totalBlocks > 0 && validBlocks / totalBlocks >= 1 - TOLERANCE) {
      bestScale = scale;
      break;
    }
  }

  return bestScale;
}

export function downscaleImage(imageData: ImageData, scale: number): PixelGrid {
  const { width, height, data } = imageData;
  const outWidth = Math.floor(width / scale);
  const outHeight = Math.floor(height / scale);
  const grid = PixelGrid.createEmpty(outWidth, outHeight);

  for (let oy = 0; oy < outHeight; oy++) {
    for (let ox = 0; ox < outWidth; ox++) {
      const sx = ox * scale;
      const sy = oy * scale;
      const offset = (sy * width + sx) * 4;
      const r = data[offset];
      const g = data[offset + 1];
      const b = data[offset + 2];
      const a = data[offset + 3];
      grid.setPixel(
        ox,
        oy,
        ((a & 0xff) << 24) | ((b & 0xff) << 16) | ((g & 0xff) << 8) | (r & 0xff),
      );
    }
  }

  return grid;
}
