export type ToolType = "brush" | "fill" | "eraser" | "shape" | "select" | "transform";

export type DrawingToolType = Exclude<ToolType, "select" | "transform">;

export type ShapeMode = "rectangle" | "line" | "ellipse";

export type BrushShape = "square" | "circle";

export type SelectionMode = "rectangle" | "ellipse" | "lasso" | "magicWand";

export type TransformMode = "move" | "scale" | "rotate";

export const MIN_STAMP_SIZE = 1;
export const MAX_STAMP_SIZE = 64;

export function clampStampSize(size: number): number {
  return Math.max(MIN_STAMP_SIZE, Math.min(MAX_STAMP_SIZE, Math.round(size)));
}

export function clampMagicWandTolerance(tolerance: number): number {
  return Math.max(0, Math.min(255, Math.round(tolerance)));
}

export interface ToolSettings {
  brushSize: number;
  brushShape: BrushShape;
  brushPerfectPixel: boolean;
  eraserSize: number;
  eraserShape: BrushShape;
  shapeMode: ShapeMode;
  shapeFilled: boolean;
  selectionMode: SelectionMode;
  magicWandTolerance: number;
  magicWandContiguous: boolean;
  transformMode: TransformMode;
}

export const DEFAULT_TOOL_SETTINGS: ToolSettings = {
  brushSize: 1,
  brushShape: "square",
  brushPerfectPixel: false,
  eraserSize: 1,
  eraserShape: "square",
  shapeMode: "rectangle",
  shapeFilled: false,
  selectionMode: "rectangle",
  magicWandTolerance: 0,
  magicWandContiguous: true,
  transformMode: "move",
};
