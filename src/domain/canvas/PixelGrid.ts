import type { CanvasSize } from "./CanvasSize";
import { createCanvasSize, pixelCount } from "./CanvasSize";
import type { PixelColor } from "./PixelColor";
import { getAlpha, rgba, toRgbaComponents, TRANSPARENT } from "./PixelColor";

export class PixelGrid {
  readonly width: number;
  readonly height: number;
  private readonly pixels: Uint32Array;

  constructor(size: CanvasSize, pixels?: Uint32Array) {
    this.width = size.width;
    this.height = size.height;
    const count = pixelCount(size);
    if (pixels) {
      if (pixels.length !== count) {
        throw new Error("Pixel buffer size mismatch");
      }
      this.pixels = new Uint32Array(pixels);
    } else {
      this.pixels = new Uint32Array(count);
    }
  }

  static createEmpty(width: number, height: number): PixelGrid {
    return new PixelGrid(createCanvasSize(width, height));
  }

  static fromRgba(
    width: number,
    height: number,
    rgbaData: Uint8ClampedArray,
  ): PixelGrid {
    const grid = PixelGrid.createEmpty(width, height);
    for (let i = 0; i < grid.pixels.length; i++) {
      const offset = i * 4;
      const r = rgbaData[offset];
      const g = rgbaData[offset + 1];
      const b = rgbaData[offset + 2];
      const a = rgbaData[offset + 3];
      grid.pixels[i] =
        ((a & 0xff) << 24) |
        ((b & 0xff) << 16) |
        ((g & 0xff) << 8) |
        (r & 0xff);
    }
    return grid;
  }

  getPixel(x: number, y: number): PixelColor {
    if (!this.inBounds(x, y)) return TRANSPARENT;
    return this.pixels[y * this.width + x];
  }

  setPixel(x: number, y: number, color: PixelColor): void {
    if (!this.inBounds(x, y)) return;
    this.pixels[y * this.width + x] = color;
  }

  inBounds(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  blitOnto(source: PixelGrid, offsetX: number, offsetY: number): void {
    for (let y = 0; y < source.height; y++) {
      for (let x = 0; x < source.width; x++) {
        const color = source.getPixel(x, y);
        if (getAlpha(color) === 0) continue;
        this.setPixel(offsetX + x, offsetY + y, color);
      }
    }
  }

  clone(): PixelGrid {
    return new PixelGrid(
      createCanvasSize(this.width, this.height),
      new Uint32Array(this.pixels),
    );
  }

  toUint32Array(): Uint32Array {
    return new Uint32Array(this.pixels);
  }

  restoreFrom(data: Uint32Array): void {
    if (data.length !== this.pixels.length) {
      throw new Error("Snapshot size mismatch");
    }
    this.pixels.set(data);
  }

  toRgba(): Uint8ClampedArray {
    const rgba = new Uint8ClampedArray(this.pixels.length * 4);
    for (let i = 0; i < this.pixels.length; i++) {
      const color = this.pixels[i];
      const offset = i * 4;
      rgba[offset] = color & 0xff;
      rgba[offset + 1] = (color >> 8) & 0xff;
      rgba[offset + 2] = (color >> 16) & 0xff;
      rgba[offset + 3] = (color >> 24) & 0xff;
    }
    return rgba;
  }

  compositeOver(base: PixelGrid): PixelGrid {
    if (base.width !== this.width || base.height !== this.height) {
      throw new Error("Cannot composite grids of different sizes");
    }
    const result = base.clone();
    this.compositeOverOnto(result, 0, 0);
    return result;
  }

  /** Alpha-composites this grid onto target at the given canvas offset. Out-of-bounds pixels are clipped. */
  compositeOverOnto(
    target: PixelGrid,
    offsetX: number,
    offsetY: number,
    layerOpacity = 255,
  ): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const canvasX = offsetX + x;
        const canvasY = offsetY + y;
        if (!target.inBounds(canvasX, canvasY)) continue;

        const source = this.pixels[y * this.width + x];
        const pixelAlpha = (source >>> 24) & 0xff;
        if (pixelAlpha === 0) continue;

        const sourceAlpha =
          layerOpacity === 255
            ? pixelAlpha
            : Math.round((pixelAlpha * layerOpacity) / 255);
        if (sourceAlpha === 0) continue;

        const destinationIndex = canvasY * target.width + canvasX;
        const destination = target.pixels[destinationIndex];

        if (sourceAlpha === 255) {
          target.pixels[destinationIndex] = (source & 0x00ffffff) | 0xff000000;
          continue;
        }

        const destinationAlpha = (destination >>> 24) & 0xff;
        const sourceWeight = sourceAlpha / 255;
        const destinationWeight = (destinationAlpha / 255) * (1 - sourceWeight);
        const outputAlpha = sourceWeight + destinationWeight;
        if (outputAlpha <= 0) continue;

        const sourceComponents = toRgbaComponents(source);
        const destinationComponents = toRgbaComponents(destination);
        const r = Math.round(
          (sourceComponents.r * sourceWeight + destinationComponents.r * destinationWeight) /
            outputAlpha,
        );
        const g = Math.round(
          (sourceComponents.g * sourceWeight + destinationComponents.g * destinationWeight) /
            outputAlpha,
        );
        const b = Math.round(
          (sourceComponents.b * sourceWeight + destinationComponents.b * destinationWeight) /
            outputAlpha,
        );
        target.pixels[destinationIndex] = rgba(r, g, b, Math.round(outputAlpha * 255));
      }
    }
  }
}
