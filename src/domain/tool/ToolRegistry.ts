import { BrushTool } from "./BrushTool";
import { EraserTool } from "./EraserTool";
import { FillTool } from "./FillTool";
import type { ITool } from "./ITool";
import { ShapeTool } from "./ShapeTool";
import type { ToolType } from "./ToolType";

const tools: Record<ToolType, ITool> = {
  brush: new BrushTool(),
  fill: new FillTool(),
  eraser: new EraserTool(),
  shape: new ShapeTool(),
};

export function getTool(type: ToolType): ITool {
  return tools[type];
}
