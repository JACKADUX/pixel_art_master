import { BrushTool } from "./BrushTool";
import { EraserTool } from "./EraserTool";
import { FillTool } from "./FillTool";
import type { ITool } from "./ITool";
import { ShapeTool } from "./ShapeTool";
import type { DrawingToolType, ToolType } from "./ToolType";

const tools: Record<DrawingToolType, ITool> = {
  brush: new BrushTool(),
  fill: new FillTool(),
  eraser: new EraserTool(),
  shape: new ShapeTool(),
};

export function getTool(type: DrawingToolType): ITool {
  return tools[type];
}

export function isDrawingToolType(type: string): type is DrawingToolType {
  return type in tools;
}

/** 画布右键保留给绘制/擦除等操作，不弹出选区上下文菜单 */
export function toolReservesCanvasRightClick(type: ToolType): boolean {
  return isDrawingToolType(type);
}
