import { isTransparent, TRANSPARENT, type PixelColor } from "../canvas/PixelColor";
import type { Point, PixelSurface } from "./ITool";

function pixelKey(x: number, y: number): string {
  return `${x},${y}`;
}

export function isRedundantCorner(a: Point, b: Point, c: Point): boolean {
  return (
    (a.x === b.x || a.y === b.y) &&
    (c.x === b.x || c.y === b.y) &&
    a.x !== c.x &&
    a.y !== c.y
  );
}

export function canRestoreCornerPixel(preStrokeColor: PixelColor): boolean {
  return isTransparent(preStrokeColor);
}

export class PixelPerfectStrokeSession {
  private strokeCenters: Point[] = [];
  private readonly originalPixels = new Map<string, PixelColor>();

  reset(): void {
    this.strokeCenters = [];
    this.originalPixels.clear();
  }

  get centers(): readonly Point[] {
    return this.strokeCenters;
  }

  private rememberOriginal(grid: PixelSurface, x: number, y: number): void {
    const key = pixelKey(x, y);
    if (!this.originalPixels.has(key)) {
      this.originalPixels.set(key, grid.getPixel(x, y));
    }
  }

  /**
   * If the last three stroke centers form an L-shape, cull the corner from the
   * stroke path. Only restore the canvas pixel when it was empty pre-stroke.
   */
  tryRemoveCorner(grid: PixelSurface, nextPoint: Point): void {
    if (this.strokeCenters.length < 2) return;

    const a = this.strokeCenters[this.strokeCenters.length - 2];
    const b = this.strokeCenters[this.strokeCenters.length - 1];
    const c = nextPoint;

    if (!isRedundantCorner(a, b, c)) return;

    const key = pixelKey(b.x, b.y);
    const original = this.originalPixels.get(key) ?? TRANSPARENT;
    if (canRestoreCornerPixel(original)) {
      grid.setPixel(b.x, b.y, original);
    }

    this.strokeCenters.pop();
  }

  commitPixel(grid: PixelSurface, point: Point, color: PixelColor): void {
    const last = this.strokeCenters[this.strokeCenters.length - 1];
    if (last && last.x === point.x && last.y === point.y) return;

    this.rememberOriginal(grid, point.x, point.y);
    grid.setPixel(point.x, point.y, color);
    this.strokeCenters.push({ x: point.x, y: point.y });
  }
}
