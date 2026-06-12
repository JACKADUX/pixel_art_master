export type ToolType = "brush" | "fill" | "eraser" | "shape";

export type ShapeMode = "rectangle" | "line" | "ellipse";

export interface ToolSettings {
  brushSize: number;
  shapeMode: ShapeMode;
  shapeFilled: boolean;
}

export const DEFAULT_TOOL_SETTINGS: ToolSettings = {
  brushSize: 1,
  shapeMode: "rectangle",
  shapeFilled: false,
};
