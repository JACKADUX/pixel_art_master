import {
  createEmptyMask,
  type SelectionMask,
} from "../selection/SelectionMask";
import { fillRectInMask } from "../selection/SelectionMaskOperations";
import type { SelectionRect } from "../selection/SelectionRect";
import { findTileCellAt, getAllTileCells, getTileCell, toLocalCoord } from "./TileRegion";

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
