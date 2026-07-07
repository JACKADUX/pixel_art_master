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
  const startX = Math.floor(fromX);
  const startY = Math.floor(fromY);
  const endX = Math.floor(toX);
  const endY = Math.floor(toY);
  const x = Math.min(startX, endX);
  const y = Math.min(startY, endY);
  const width = Math.abs(endX - startX) + 1;
  const height = Math.abs(endY - startY) + 1;
  return { x, y, width, height };
}

export function rectsEqual(a: SelectionRect, b: SelectionRect): boolean {
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}
