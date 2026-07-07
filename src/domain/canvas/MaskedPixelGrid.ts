import type { PixelColor } from "./PixelColor";
import { PixelGrid } from "./PixelGrid";
import { LayerProjectedSurface } from "./LayerProjectedSurface";
import { isMaskSelected, type SelectionMask } from "../selection/SelectionMask";

/** Surface addressed in canvas coordinates (full canvas or projected layer). */
export interface CanvasPixelSurface {
  readonly width: number;
  readonly height: number;
  getPixel(x: number, y: number): PixelColor;
  setPixel(x: number, y: number, color: PixelColor): void;
  inBounds(x: number, y: number): boolean;
}

export type WritableCanvasSurface = PixelGrid | LayerProjectedSurface;

export class MaskedPixelGrid {
  readonly width: number;
  readonly height: number;
  private readonly grid: WritableCanvasSurface;
  private readonly mask: SelectionMask | null;

  constructor(grid: WritableCanvasSurface, mask: SelectionMask | null) {
    this.grid = grid;
    this.mask = mask;
    this.width = grid.width;
    this.height = grid.height;
  }

  getPixel(x: number, y: number): number {
    return this.grid.getPixel(x, y);
  }

  setPixel(x: number, y: number, color: number): void {
    if (this.mask && !isMaskSelected(this.mask, x, y)) return;
    this.grid.setPixel(x, y, color);
  }

  inBounds(x: number, y: number): boolean {
    return this.grid.inBounds(x, y);
  }

  clone(): PixelGrid {
    return this.getUnderlyingGrid().clone();
  }

  toUint32Array(): Uint32Array {
    return this.getUnderlyingGrid().toUint32Array();
  }

  restoreFrom(data: Uint32Array): void {
    this.getUnderlyingGrid().restoreFrom(data);
  }

  getUnderlyingGrid(): PixelGrid {
    if (this.grid instanceof LayerProjectedSurface) {
      return this.grid.underlyingGrid;
    }
    return this.grid;
  }
}

export function wrapWithMask(
  grid: WritableCanvasSurface,
  mask: SelectionMask | null,
): MaskedPixelGrid {
  return new MaskedPixelGrid(grid, mask);
}
