import { TRANSPARENT } from "../canvas/PixelColor";
import type { WritableCanvasSurface } from "../canvas/MaskedPixelGrid";
import {
  createEmptyMask,
  type SelectionMask,
} from "../selection/SelectionMask";
import { fillRectInMask } from "../selection/SelectionMaskOperations";
import type { SelectionRect } from "../selection/SelectionRect";
import { findTileCellAt, getAllTileCells, getTileCell, toLocalCoord } from "./TileRegion";

export function regionHasVisiblePixels(
  grid: WritableCanvasSurface,
  region: SelectionRect,
): boolean {
  for (let y = 0; y < region.height; y++) {
    for (let x = 0; x < region.width; x++) {
      const pixel = grid.getPixel(region.x + x, region.y + y);
      if (pixel !== TRANSPARENT && pixel !== 0) return true;
    }
  }
  return false;
}

export function replicateTilePatternFromRegion(
  grid: WritableCanvasSurface,
  region: SelectionRect,
): void {
  const pattern: number[] = [];
  for (let y = 0; y < region.height; y++) {
    for (let x = 0; x < region.width; x++) {
      pattern.push(grid.getPixel(region.x + x, region.y + y));
    }
  }

  for (const cell of getAllTileCells(region)) {
    let index = 0;
    for (let dy = 0; dy < region.height; dy++) {
      for (let dx = 0; dx < region.width; dx++) {
        const wx = cell.x + dx;
        const wy = cell.y + dy;
        if (grid.inBounds(wx, wy)) {
          grid.setPixel(wx, wy, pattern[index]!);
        }
        index++;
      }
    }
  }
}

export function forEachTileReplicatedPoint(
  x: number,
  y: number,
  region: SelectionRect,
  callback: (wx: number, wy: number) => void,
): void {
  const local = toLocalCoord(x, y, region);
  if (!local) return;

  const seen = new Set<string>();
  for (const cell of [
    { col: -1, row: -1 },
    { col: 0, row: -1 },
    { col: 1, row: -1 },
    { col: -1, row: 0 },
    { col: 0, row: 0 },
    { col: 1, row: 0 },
    { col: -1, row: 1 },
    { col: 0, row: 1 },
    { col: 1, row: 1 },
  ] as const) {
    const tileRect = getTileCell(region, cell.col, cell.row);
    const wx = tileRect.x + local.lx;
    const wy = tileRect.y + local.ly;
    const key = `${wx},${wy}`;
    if (seen.has(key)) continue;
    seen.add(key);
    callback(wx, wy);
  }
}

export function createTileUnionMask(
  region: SelectionRect,
  canvasWidth: number,
  canvasHeight: number,
): SelectionMask {
  const mask = createEmptyMask(canvasWidth, canvasHeight);
  for (const cell of getAllTileCells(region)) {
    const clipped: SelectionRect = {
      x: Math.max(0, cell.x),
      y: Math.max(0, cell.y),
      width: Math.min(cell.x + cell.width, canvasWidth) - Math.max(0, cell.x),
      height: Math.min(cell.y + cell.height, canvasHeight) - Math.max(0, cell.y),
    };
    if (clipped.width > 0 && clipped.height > 0) {
      fillRectInMask(mask, clipped);
    }
  }
  return mask;
}

export function createTileCellMask(
  x: number,
  y: number,
  region: SelectionRect,
  canvasWidth: number,
  canvasHeight: number,
): SelectionMask | null {
  const cellOffset = findTileCellAt(x, y, region);
  if (!cellOffset) return null;

  const mask = createEmptyMask(canvasWidth, canvasHeight);
  const cell = getTileCell(region, cellOffset.col, cellOffset.row);
  const clipped: SelectionRect = {
    x: Math.max(0, cell.x),
    y: Math.max(0, cell.y),
    width: Math.min(cell.x + cell.width, canvasWidth) - Math.max(0, cell.x),
    height: Math.min(cell.y + cell.height, canvasHeight) - Math.max(0, cell.y),
  };
  if (clipped.width <= 0 || clipped.height <= 0) return mask;
  fillRectInMask(mask, clipped);
  return mask;
}
