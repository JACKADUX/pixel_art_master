import type { PixelGrid } from "../canvas/PixelGrid";
import type { SelectionRect } from "../selection/SelectionRect";
import { EMPTY_RECT } from "../selection/SelectionRect";

export type TileSessionPhase = "idle" | "creating" | "drawing";

export interface TileSessionState {
  phase: TileSessionPhase;
  region: SelectionRect;
  peripheralSnapshot: Uint32Array | null;
}

export function createIdleTileSession(): TileSessionState {
  return {
    phase: "idle",
    region: { ...EMPTY_RECT },
    peripheralSnapshot: null,
  };
}

export function captureCanvasSnapshot(grid: PixelGrid): Uint32Array {
  return grid.toUint32Array();
}

export function finalizeTileSession(
  grid: PixelGrid,
  region: SelectionRect,
  snapshot: Uint32Array,
): void {
  const centerPixels: number[] = [];
  for (let y = 0; y < region.height; y++) {
    for (let x = 0; x < region.width; x++) {
      centerPixels.push(grid.getPixel(region.x + x, region.y + y));
    }
  }

  grid.restoreFrom(snapshot);

  let index = 0;
  for (let y = 0; y < region.height; y++) {
    for (let x = 0; x < region.width; x++) {
      grid.setPixel(region.x + x, region.y + y, centerPixels[index]!);
      index++;
    }
  }
}
