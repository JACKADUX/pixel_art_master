import type { PixelGrid } from "@/domain/canvas/PixelGrid";
import type { PixelColor } from "@/domain/canvas/PixelColor";
import { getTool } from "@/domain/tool/ToolRegistry";
import type { Point, ToolContext } from "@/domain/tool/ITool";
import type { ToolSettings, ToolType } from "@/domain/tool/ToolType";

export function applyToolPointerDown(
  grid: PixelGrid,
  toolType: ToolType,
  color: PixelColor,
  settings: ToolSettings,
  point: Point,
): void {
  const tool = getTool(toolType);
  const ctx: ToolContext = { grid, color, settings };
  tool.onPointerDown(ctx, point);
}

export function applyToolPointerMove(
  grid: PixelGrid,
  toolType: ToolType,
  color: PixelColor,
  settings: ToolSettings,
  from: Point,
  to: Point,
): void {
  const tool = getTool(toolType);
  const ctx: ToolContext = { grid, color, settings };
  tool.onPointerMove(ctx, from, to);
}

export function applyToolPointerUp(
  grid: PixelGrid,
  toolType: ToolType,
  color: PixelColor,
  settings: ToolSettings,
  from: Point,
  to: Point,
): void {
  const tool = getTool(toolType);
  const ctx: ToolContext = { grid, color, settings };
  tool.onPointerUp(ctx, from, to);
}
