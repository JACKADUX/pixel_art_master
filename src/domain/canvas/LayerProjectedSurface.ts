import type { PixelColor } from "./PixelColor";
import { TRANSPARENT } from "./PixelColor";
import type { PixelGrid } from "./PixelGrid";
import type { LayerPosition } from "../layer/Layer";
import type { Point } from "../tool/ITool";

/**
 * Maps canvas coordinates to a layer-local pixel grid positioned on the canvas.
 * Used by drawing, selection, and color-pick tools so they can keep using canvas coords.
 */
export class LayerProjectedSurface {
  readonly width: number;
  readonly height: number;

  constructor(
    private readonly layerGrid: PixelGrid,
    private readonly position: LayerPosition,
    canvasSize: { width: number; height: number },
  ) {
    this.width = canvasSize.width;
    this.height = canvasSize.height;
  }

  getPixel(canvasX: number, canvasY: number): PixelColor {
    return this.layerGrid.getPixel(canvasX - this.position.x, canvasY - this.position.y);
  }

  setPixel(canvasX: number, canvasY: number, color: PixelColor): void {
    this.layerGrid.setPixel(canvasX - this.position.x, canvasY - this.position.y, color);
  }

  inBounds(canvasX: number, canvasY: number): boolean {
    const localX = canvasX - this.position.x;
    const localY = canvasY - this.position.y;
    return this.layerGrid.inBounds(localX, localY);
  }

  toLayerLocal(canvasPoint: Point): Point {
    return {
      x: canvasPoint.x - this.position.x,
      y: canvasPoint.y - this.position.y,
    };
  }

  toCanvas(localPoint: Point): Point {
    return {
      x: localPoint.x + this.position.x,
      y: localPoint.y + this.position.y,
    };
  }

  clone(): PixelGrid {
    return this.layerGrid.clone();
  }

  toUint32Array(): Uint32Array {
    return this.layerGrid.toUint32Array();
  }

  restoreFrom(data: Uint32Array): void {
    this.layerGrid.restoreFrom(data);
  }

  get underlyingGrid(): PixelGrid {
    return this.layerGrid;
  }

  get layerPosition(): LayerPosition {
    return this.position;
  }
}

export function wrapLayerOnCanvas(
  layerGrid: PixelGrid,
  position: LayerPosition,
  canvasSize: { width: number; height: number },
): LayerProjectedSurface {
  return new LayerProjectedSurface(layerGrid, position, canvasSize);
}

export function isTransparentAtCanvas(
  surface: LayerProjectedSurface,
  canvasX: number,
  canvasY: number,
): boolean {
  if (!surface.inBounds(canvasX, canvasY)) return true;
  return surface.getPixel(canvasX, canvasY) === TRANSPARENT;
}
