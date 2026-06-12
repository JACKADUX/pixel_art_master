export interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const EMPTY_RECT: SelectionRect = { x: 0, y: 0, width: 0, height: 0 };

export function normalizeRect(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
): SelectionRect {
  const x = Math.min(Math.floor(fromX), Math.floor(toX));
  const y = Math.min(Math.floor(fromY), Math.floor(toY));
  const width = Math.max(1, Math.abs(Math.floor(toX) - Math.floor(fromX)));
  const height = Math.max(1, Math.abs(Math.floor(toY) - Math.floor(fromY)));
  return { x, y, width, height };
}

export function rectsEqual(a: SelectionRect, b: SelectionRect): boolean {
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}
