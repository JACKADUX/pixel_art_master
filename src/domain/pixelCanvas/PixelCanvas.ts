import type { Layer } from "../layer/Layer";
import { createEmptyDrawingLayer } from "../layer/Layer";
import type { CanvasSize } from "../canvas/CanvasSize";
import { DEFAULT_CANVAS_SIZE } from "../canvas/CanvasSizePreset";

export interface BoardPosition {
  x: number;
  y: number;
}

export const DEFAULT_BOARD_POSITION: BoardPosition = { x: 0, y: 0 };

/** 独立像素画板实体，拥有独立尺寸与绘制层栈 */
export interface PixelCanvas {
  id: string;
  name: string;
  boardPosition: BoardPosition;
  width: number;
  height: number;
  scaleFactor: number;
  layers: Layer[];
  activeLayerId: string;
}

export function createEmptyPixelCanvas(
  name: string,
  size: CanvasSize = DEFAULT_CANVAS_SIZE,
  boardPosition: BoardPosition = DEFAULT_BOARD_POSITION,
): PixelCanvas {
  const drawing = createEmptyDrawingLayer(size, "绘制层");
  return {
    id: crypto.randomUUID(),
    name,
    boardPosition: { ...boardPosition },
    width: size.width,
    height: size.height,
    scaleFactor: 1,
    layers: [drawing],
    activeLayerId: drawing.id,
  };
}

export function getCanvasSizeFromPixelCanvas(canvas: PixelCanvas): CanvasSize {
  return { width: canvas.width, height: canvas.height };
}
