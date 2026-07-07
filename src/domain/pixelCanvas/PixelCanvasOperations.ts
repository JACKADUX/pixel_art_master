import type { CanvasSize } from "../canvas/CanvasSize";
import type { PixelGrid } from "../canvas/PixelGrid";
import { createDrawingLayer } from "../layer/Layer";
import { normalizeLayerStack } from "../layer/LayerStack";
import { isDrawingLayer } from "../layer/LayerTypeGuards";
import type { BoardPosition, PixelCanvas } from "./PixelCanvas";
import { createEmptyPixelCanvas } from "./PixelCanvas";
import type { CanvasBoard } from "./CanvasBoard";
import { getActiveCanvas, withActiveCanvasId, withCanvases } from "./CanvasBoard";

export const BOARD_CANVAS_GAP = 16;

function allocateNextCanvasName(board: CanvasBoard): {
  name: string;
  totalCanvasCount: number;
} {
  const totalCanvasCount = board.totalCanvasCount + 1;
  return { name: `画板 ${totalCanvasCount}`, totalCanvasCount };
}

export function addPixelCanvasToBoard(
  board: CanvasBoard,
  name?: string,
  size?: CanvasSize,
): CanvasBoard {
  const { name: defaultName, totalCanvasCount } = allocateNextCanvasName(board);
  const canvasName = name ?? defaultName;
  const position = computeNextCanvasBoardPosition(board);
  const canvas = createEmptyPixelCanvas(canvasName, size, position);
  return withActiveCanvasId(
    {
      ...withCanvases(board, [...board.canvases, canvas]),
      totalCanvasCount,
    },
    canvas.id,
  );
}

/** 在指定工作区坐标创建与图像同尺寸的画板，并导入绘制层（图层位置归零） */
export function addPixelCanvasWithDrawingLayerToBoard(
  board: CanvasBoard,
  grid: PixelGrid,
  boardPosition: BoardPosition,
  options?: { canvasName?: string; layerName?: string },
): CanvasBoard {
  const { name: defaultName, totalCanvasCount } = allocateNextCanvasName(board);
  const drawingLayer = createDrawingLayer(grid, options?.layerName ?? "绘制层", { x: 0, y: 0 });
  const canvas: PixelCanvas = {
    id: crypto.randomUUID(),
    name: options?.canvasName ?? defaultName,
    boardPosition: { ...boardPosition },
    width: grid.width,
    height: grid.height,
    scaleFactor: 1,
    layers: [drawingLayer],
    activeLayerId: drawingLayer.id,
  };

  return withActiveCanvasId(
    {
      ...withCanvases(board, [...board.canvases, canvas]),
      totalCanvasCount,
    },
    canvas.id,
  );
}

export function removePixelCanvasFromBoard(board: CanvasBoard, canvasId: string): CanvasBoard | null {
  if (board.canvases.length <= 1) return null;
  const nextCanvases = board.canvases.filter((c) => c.id !== canvasId);
  const nextActiveId =
    board.activeCanvasId === canvasId ? nextCanvases[0].id : board.activeCanvasId;
  return withActiveCanvasId(withCanvases(board, nextCanvases), nextActiveId);
}

export function movePixelCanvasOnBoard(
  board: CanvasBoard,
  canvasId: string,
  boardPosition: BoardPosition,
): CanvasBoard {
  const canvases = board.canvases.map((c) =>
    c.id === canvasId ? { ...c, boardPosition: { ...boardPosition } } : c,
  );
  return withCanvases(board, canvases);
}

export function renamePixelCanvas(
  board: CanvasBoard,
  canvasId: string,
  name: string,
): CanvasBoard {
  const trimmed = name.trim();
  if (!trimmed) return board;
  const canvases = board.canvases.map((c) =>
    c.id === canvasId ? { ...c, name: trimmed } : c,
  );
  return withCanvases(board, canvases);
}

export function duplicatePixelCanvasOnBoard(board: CanvasBoard, canvasId: string): CanvasBoard {
  const source = board.canvases.find((c) => c.id === canvasId);
  if (!source) return board;

  const position = {
    x: source.boardPosition.x + source.width + BOARD_CANVAS_GAP,
    y: source.boardPosition.y,
  };
  const cloneLayers = normalizeLayerStack(
    source.layers.filter((layer) => isDrawingLayer(layer)).map((layer) => ({
      ...layer,
      id: crypto.randomUUID(),
      pixels: new Uint32Array(layer.pixels),
    })),
  );
  const drawingLayer = cloneLayers.find((l) => l.type === "drawing");
  const { name, totalCanvasCount } = allocateNextCanvasName(board);

  const clone: PixelCanvas = {
    ...source,
    id: crypto.randomUUID(),
    name,
    boardPosition: position,
    layers: cloneLayers,
    activeLayerId: drawingLayer?.id ?? source.activeLayerId,
  };

  return withActiveCanvasId(
    {
      ...withCanvases(board, [...board.canvases, clone]),
      totalCanvasCount,
    },
    clone.id,
  );
}

export function updatePixelCanvasOnBoard(
  board: CanvasBoard,
  canvasId: string,
  patch: Partial<Pick<PixelCanvas, "width" | "height" | "scaleFactor" | "layers" | "activeLayerId">>,
): CanvasBoard {
  const canvases = board.canvases.map((c) =>
    c.id === canvasId ? { ...c, ...patch } : c,
  );
  return withCanvases(board, canvases);
}

function computeNextCanvasBoardPosition(board: CanvasBoard): BoardPosition {
  if (board.canvases.length === 0) return { x: 0, y: 0 };
  const active = getActiveCanvas(board);
  return {
    x: active.boardPosition.x + active.width + BOARD_CANVAS_GAP,
    y: active.boardPosition.y,
  };
}
