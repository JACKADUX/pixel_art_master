import { BrushTool } from "./BrushTool";
import { EraserTool } from "./EraserTool";
import { FillTool } from "./FillTool";
import type { ITool } from "./ITool";
import { ShapeTool } from "./ShapeTool";
import type { DrawingToolType } from "./ToolType";

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
