import type { CanvasSize } from "../canvas/CanvasSize";
import {
  createEmptyPixelCanvas,
  type BoardPosition,
  type PixelCanvas,
} from "./PixelCanvas";

/** 工作区画板集合，管理多个独立 PixelCanvas */
export interface CanvasBoard {
  canvases: PixelCanvas[];
  activeCanvasId: string;
  /** 项目累计创建过的画板数量（含已删除），用于命名 */
  totalCanvasCount: number;
}

export function createCanvasBoard(
  name = "画板 1",
  size?: CanvasSize,
  boardPosition?: BoardPosition,
): CanvasBoard {
  const canvas = createEmptyPixelCanvas(name, size, boardPosition);
  return {
    canvases: [canvas],
    activeCanvasId: canvas.id,
    totalCanvasCount: 1,
  };
}

export function resolveCanvas(board: CanvasBoard, canvasId: string): PixelCanvas | undefined {
  return board.canvases.find((c) => c.id === canvasId);
}

export function getActiveCanvas(board: CanvasBoard): PixelCanvas {
  const active = resolveCanvas(board, board.activeCanvasId);
  if (active) return active;
  return board.canvases[0];
}

export function withActiveCanvasId(board: CanvasBoard, canvasId: string): CanvasBoard {
  if (!resolveCanvas(board, canvasId)) return board;
  return { ...board, activeCanvasId: canvasId };
}

export function withCanvases(board: CanvasBoard, canvases: PixelCanvas[]): CanvasBoard {
  return { ...board, canvases };
}
