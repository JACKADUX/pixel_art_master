import type { PixelGrid } from "./PixelGrid";
import type { MaskedPixelGrid } from "./MaskedPixelGrid";
import { LayerProjectedSurface } from "./LayerProjectedSurface";
import { forEachSymmetricPoint } from "../symmetry/SymmetryMirror";
import type { SymmetryConfig } from "../symmetry/SymmetryConfig";
import { isSymmetryActive } from "../symmetry/SymmetryConfig";

export type SymmetricPixelSurfaceUnderlying = PixelGrid | MaskedPixelGrid | LayerProjectedSurface;

export class SymmetricPixelSurface {
  readonly width: number;
  readonly height: number;
  private readonly underlying: SymmetricPixelSurfaceUnderlying;
  private readonly config: SymmetryConfig;

  constructor(underlying: SymmetricPixelSurfaceUnderlying, config: SymmetryConfig) {
    this.underlying = underlying;
    this.config = config;
    this.width = underlying.width;
    this.height = underlying.height;
  }

  getPixel(x: number, y: number): number {
    return this.underlying.getPixel(x, y);
  }

  setPixel(x: number, y: number, color: number): void {
    if (!isSymmetryActive(this.config)) {
      this.underlying.setPixel(x, y, color);
      return;
    }

    forEachSymmetricPoint(x, y, this.config, (mx, my) => {
      if (this.underlying.inBounds(mx, my)) {
        this.underlying.setPixel(mx, my, color);
      }
    });
  }

  inBounds(x: number, y: number): boolean {
    return this.underlying.inBounds(x, y);
  }

  clone(): PixelGrid {
    return this.underlying.clone();
  }

  toUint32Array(): Uint32Array {
    return this.underlying.toUint32Array();
  }

  restoreFrom(data: Uint32Array): void {
    this.underlying.restoreFrom(data);
  }

  getUnderlyingSurface(): SymmetricPixelSurfaceUnderlying {
    return this.underlying;
  }
}

export function wrapWithSymmetry(
  surface: SymmetricPixelSurfaceUnderlying,
  config: SymmetryConfig | null | undefined,
): SymmetricPixelSurfaceUnderlying | SymmetricPixelSurface {
  if (!config || !isSymmetryActive(config)) return surface;
  return new SymmetricPixelSurface(surface, config);
}
