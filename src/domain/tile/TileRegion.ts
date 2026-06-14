import type { SelectionRect } from "../selection/SelectionRect";

export type TileCellOffset = { col: -1 | 0 | 1; row: -1 | 0 | 1 };

const TILE_OFFSETS: TileCellOffset[] = [
  { col: -1, row: -1 },
  { col: 0, row: -1 },
  { col: 1, row: -1 },
  { col: -1, row: 0 },
  { col: 0, row: 0 },
  { col: 1, row: 0 },
  { col: -1, row: 1 },
  { col: 0, row: 1 },
  { col: 1, row: 1 },
];

export function getTileCell(region: SelectionRect, col: number, row: number): SelectionRect {
  return {
    x: region.x + col * region.width,
    y: region.y + row * region.height,
    width: region.width,
    height: region.height,
  };
}

export function getAllTileCells(region: SelectionRect): SelectionRect[] {
  return TILE_OFFSETS.map(({ col, row }) => getTileCell(region, col, row));
}

export function findTileCellAt(
  x: number,
  y: number,
  region: SelectionRect,
): TileCellOffset | null {
  if (region.width <= 0 || region.height <= 0) return null;

  const col = Math.floor((x - region.x) / region.width);
  const row = Math.floor((y - region.y) / region.height);
  if (col < -1 || col > 1 || row < -1 || row > 1) return null;

  const cell = getTileCell(region, col, row);
  if (x < cell.x || y < cell.y || x >= cell.x + cell.width || y >= cell.y + cell.height) {
    return null;
  }

  return { col: col as -1 | 0 | 1, row: row as -1 | 0 | 1 };
}

export function toLocalCoord(
  x: number,
  y: number,
  region: SelectionRect,
): { lx: number; ly: number } | null {
  const cell = findTileCellAt(x, y, region);
  if (!cell) return null;

  const tileRect = getTileCell(region, cell.col, cell.row);
  return {
    lx: x - tileRect.x,
    ly: y - tileRect.y,
  };
}

export function isPointInTileUnion(x: number, y: number, region: SelectionRect): boolean {
  return findTileCellAt(x, y, region) !== null;
}
