import { PixelGrid } from "./PixelGrid";
import { isMaskSelected, type SelectionMask } from "../selection/SelectionMask";

export class MaskedPixelGrid {
  readonly width: number;
  readonly height: number;
  private readonly grid: PixelGrid;
  private readonly mask: SelectionMask | null;

  constructor(grid: PixelGrid, mask: SelectionMask | null) {
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
    return this.grid.clone();
  }

  toUint32Array(): Uint32Array {
    return this.grid.toUint32Array();
  }

  restoreFrom(data: Uint32Array): void {
    this.grid.restoreFrom(data);
  }

  getUnderlyingGrid(): PixelGrid {
    return this.grid;
  }
}

export function wrapWithMask(grid: PixelGrid, mask: SelectionMask | null): MaskedPixelGrid {
  return new MaskedPixelGrid(grid, mask);
}
