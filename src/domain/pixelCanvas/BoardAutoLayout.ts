import type { CanvasBoard } from "./CanvasBoard";
import { withCanvases } from "./CanvasBoard";
import type { BoardPosition } from "./PixelCanvas";
import { BOARD_CANVAS_GAP } from "./PixelCanvasOperations";

export interface BoardLayoutItem {
  canvasId: string;
  width: number;
  height: number;
}

interface GridLayoutResult {
  positions: Map<string, BoardPosition>;
  boundingWidth: number;
  boundingHeight: number;
}

function layoutWithColumns(
  items: BoardLayoutItem[],
  cols: number,
  gap: number,
): GridLayoutResult {
  const positions = new Map<string, BoardPosition>();
  if (items.length === 0) {
    return { positions, boundingWidth: 0, boundingHeight: 0 };
  }

  let y = 0;
  let maxWidth = 0;

  for (let rowStart = 0; rowStart < items.length; rowStart += cols) {
    const rowItems = items.slice(rowStart, rowStart + cols);
    let x = 0;
    let rowHeight = 0;

    for (const item of rowItems) {
      positions.set(item.canvasId, { x, y });
      x += item.width + gap;
      rowHeight = Math.max(rowHeight, item.height);
    }

    const rowWidth = rowItems.length > 0 ? x - gap : 0;
    maxWidth = Math.max(maxWidth, rowWidth);
    y += rowHeight + gap;
  }

  const boundingHeight = y > 0 ? y - gap : 0;
  return {
    positions,
    boundingWidth: maxWidth,
    boundingHeight,
  };
}

function normalizePositions(
  positions: Map<string, BoardPosition>,
): Map<string, BoardPosition> {
  if (positions.size === 0) return positions;

  let minX = Infinity;
  let minY = Infinity;
  for (const pos of positions.values()) {
    minX = Math.min(minX, pos.x);
    minY = Math.min(minY, pos.y);
  }

  const normalized = new Map<string, BoardPosition>();
  for (const [id, pos] of positions) {
    normalized.set(id, { x: pos.x - minX, y: pos.y - minY });
  }
  return normalized;
}

/** 按最小正方形包围面积枚举列数并排布画板 */
export function computeMinimumSquareBoardLayout(
  items: BoardLayoutItem[],
  gap: number = BOARD_CANVAS_GAP,
): Map<string, BoardPosition> {
  if (items.length === 0) return new Map();

  const n = items.length;
  let bestCols = 1;
  let bestScore = Infinity;
  let bestPositions = new Map<string, BoardPosition>();

  for (let cols = 1; cols <= n; cols += 1) {
    const { positions, boundingWidth, boundingHeight } = layoutWithColumns(items, cols, gap);
    const score = Math.max(boundingWidth, boundingHeight);
    if (score < bestScore || (score === bestScore && cols < bestCols)) {
      bestScore = score;
      bestCols = cols;
      bestPositions = positions;
    }
  }

  return normalizePositions(bestPositions);
}

export function layoutCanvasesOnBoard(
  board: CanvasBoard,
  gap: number = BOARD_CANVAS_GAP,
): CanvasBoard {
  const items: BoardLayoutItem[] = board.canvases.map((canvas) => ({
    canvasId: canvas.id,
    width: canvas.width,
    height: canvas.height,
  }));
  const positions = computeMinimumSquareBoardLayout(items, gap);
  const canvases = board.canvases.map((canvas) => {
    const position = positions.get(canvas.id);
    return position ? { ...canvas, boardPosition: { ...position } } : canvas;
  });
  return withCanvases(board, canvases);
}
