export type ToolType = "brush" | "fill" | "eraser" | "shape";

export type ShapeMode = "rectangle" | "line" | "ellipse";

export type BrushShape = "square" | "circle";

export const MIN_STAMP_SIZE = 1;
export const MAX_STAMP_SIZE = 64;

export function clampStampSize(size: number): number {
  return Math.max(MIN_STAMP_SIZE, Math.min(MAX_STAMP_SIZE, Math.round(size)));
}

export interface ToolSettings {
  brushSize: number;
  brushShape: BrushShape;
  eraserSize: number;
  eraserShape: BrushShape;
  shapeMode: ShapeMode;
  shapeFilled: boolean;
}

export const DEFAULT_TOOL_SETTINGS: ToolSettings = {
  brushSize: 1,
  brushShape: "square",
  eraserSize: 1,
  eraserShape: "square",
  shapeMode: "rectangle",
  shapeFilled: false,
};
