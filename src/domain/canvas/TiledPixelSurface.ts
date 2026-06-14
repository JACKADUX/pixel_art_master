import type { PixelGrid } from "./PixelGrid";
import type { MaskedPixelGrid } from "./MaskedPixelGrid";
import { findTileCellAt } from "../tile/TileRegion";
import { forEachTileReplicatedPoint } from "../tile/TileReplication";
import type { SelectionRect } from "../selection/SelectionRect";

export type TiledPixelSurfaceUnderlying = PixelGrid | MaskedPixelGrid;

export class TiledPixelSurface {
  readonly width: number;
  readonly height: number;
  private readonly underlying: TiledPixelSurfaceUnderlying;
  private readonly region: SelectionRect;

  constructor(underlying: TiledPixelSurfaceUnderlying, region: SelectionRect) {
    this.underlying = underlying;
    this.region = region;
    this.width = underlying.width;
    this.height = underlying.height;
  }

  getPixel(x: number, y: number): number {
    return this.underlying.getPixel(x, y);
  }

  setPixel(x: number, y: number, color: number): void {
    if (!findTileCellAt(x, y, this.region)) return;

    forEachTileReplicatedPoint(x, y, this.region, (wx, wy) => {
      if (this.underlying.inBounds(wx, wy)) {
        this.underlying.setPixel(wx, wy, color);
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

  getUnderlyingSurface(): TiledPixelSurfaceUnderlying {
    return this.underlying;
  }
}

export function wrapWithTile(
  surface: TiledPixelSurfaceUnderlying,
  region: SelectionRect | null | undefined,
): TiledPixelSurfaceUnderlying | TiledPixelSurface {
  if (!region || region.width <= 0 || region.height <= 0) return surface;
  return new TiledPixelSurface(surface, region);
}
