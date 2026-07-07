import type { WritableCanvasSurface } from "../canvas/MaskedPixelGrid";
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

export function captureCanvasSnapshot(grid: WritableCanvasSurface): Uint32Array {
  const snapshot = new Uint32Array(grid.width * grid.height);
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      snapshot[y * grid.width + x] = grid.getPixel(x, y);
    }
  }
  return snapshot;
}

export function finalizeTileSession(
  grid: WritableCanvasSurface,
  region: SelectionRect,
  snapshot: Uint32Array,
): void {
  const centerPixels: number[] = [];
  for (let y = 0; y < region.height; y++) {
    for (let x = 0; x < region.width; x++) {
      centerPixels.push(grid.getPixel(region.x + x, region.y + y));
    }
  }

  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      grid.setPixel(x, y, snapshot[y * grid.width + x]!);
    }
  }

  let index = 0;
  for (let y = 0; y < region.height; y++) {
    for (let x = 0; x < region.width; x++) {
      grid.setPixel(region.x + x, region.y + y, centerPixels[index]!);
      index++;
    }
  }
}
