export type ToolType =
  | "brush"
  | "fill"
  | "eraser"
  | "shape"
  | "select"
  | "transform"
  | "repeatTile"
  | "canvasResize";

export type DrawingToolType = Exclude<
  ToolType,
  "select" | "transform" | "repeatTile" | "canvasResize"
>;

export type ShapeMode = "rectangle" | "line" | "ellipse";

export type BrushShape = "square" | "circle" | "pattern";

export const MIN_PATTERN_SCALE = 0;
export const MAX_PATTERN_SCALE = 500;
export const DEFAULT_PATTERN_SCALE = 100;

export function clampPatternScale(scalePercent: number): number {
  return Math.max(MIN_PATTERN_SCALE, Math.min(MAX_PATTERN_SCALE, Math.round(scalePercent)));
}

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

export function clampFillTolerance(tolerance: number): number {
  return Math.max(0, Math.min(255, Math.round(tolerance)));
}

export const MIN_CANVAS_RESIZE_STEP = 1;
export const MAX_CANVAS_RESIZE_STEP = 512;
export const DEFAULT_CANVAS_RESIZE_STEP = 32;

export function clampCanvasResizeStep(step: number): number {
  return Math.max(
    MIN_CANVAS_RESIZE_STEP,
    Math.min(MAX_CANVAS_RESIZE_STEP, Math.round(step)),
  );
}

export interface ToolSettings {
  brushSize: number;
  brushShape: BrushShape;
  brushPerfectPixel: boolean;
  patternBrushScale: number;
  patternBrushFlipHorizontal: boolean;
  patternBrushFlipVertical: boolean;
  eraserSize: number;
  eraserShape: BrushShape;
  shapeMode: ShapeMode;
  shapeFilled: boolean;
  fillTolerance: number;
  fillContiguous: boolean;
  selectionMode: SelectionMode;
  magicWandTolerance: number;
  magicWandContiguous: boolean;
  transformMode: TransformMode;
  canvasResizeStep: number;
  canvasResizeFixedStep: boolean;
}

export const DEFAULT_TOOL_SETTINGS: ToolSettings = {
  brushSize: 1,
  brushShape: "square",
  brushPerfectPixel: false,
  patternBrushScale: DEFAULT_PATTERN_SCALE,
  patternBrushFlipHorizontal: false,
  patternBrushFlipVertical: false,
  eraserSize: 1,
  eraserShape: "square",
  shapeMode: "rectangle",
  shapeFilled: false,
  fillTolerance: 0,
  fillContiguous: true,
  selectionMode: "rectangle",
  magicWandTolerance: 0,
  magicWandContiguous: true,
  transformMode: "move",
  canvasResizeStep: DEFAULT_CANVAS_RESIZE_STEP,
  canvasResizeFixedStep: false,
};
