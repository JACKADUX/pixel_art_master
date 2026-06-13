import type { PixelGrid } from "@/domain/canvas/PixelGrid";
import { wrapWithMask } from "@/domain/canvas/MaskedPixelGrid";
import type { PixelColor } from "@/domain/canvas/PixelColor";
import type { SelectionMask } from "@/domain/selection/SelectionMask";
import { paintBrushStraightLine } from "@/domain/tool/BrushStroke";
import { PixelPerfectStrokeSession } from "@/domain/tool/PixelPerfectStroke";
import { getTool } from "@/domain/tool/ToolRegistry";
import type { Point, ToolContext } from "@/domain/tool/ITool";
import type { ToolSettings, DrawingToolType } from "@/domain/tool/ToolType";

function createToolContext(
  grid: PixelGrid,
  color: PixelColor,
  settings: ToolSettings,
  selectionMask?: SelectionMask | null,
): ToolContext {
  const surface = selectionMask ? wrapWithMask(grid, selectionMask) : grid;
  return { grid: surface, color, settings, selectionMask: selectionMask ?? null };
}

export function applyToolPointerDown(
  grid: PixelGrid,
  toolType: DrawingToolType,
  color: PixelColor,
  settings: ToolSettings,
  point: Point,
  selectionMask?: SelectionMask | null,
): void {
  const tool = getTool(toolType);
  const ctx = createToolContext(grid, color, settings, selectionMask);
  tool.onPointerDown(ctx, point);
}

export function applyToolPointerMove(
  grid: PixelGrid,
  toolType: DrawingToolType,
  color: PixelColor,
  settings: ToolSettings,
  from: Point,
  to: Point,
  selectionMask?: SelectionMask | null,
): void {
  const tool = getTool(toolType);
  const ctx = createToolContext(grid, color, settings, selectionMask);
  tool.onPointerMove(ctx, from, to);
}

export function applyToolPointerUp(
  grid: PixelGrid,
  toolType: DrawingToolType,
  color: PixelColor,
  settings: ToolSettings,
  from: Point,
  to: Point,
  selectionMask?: SelectionMask | null,
): void {
  const tool = getTool(toolType);
  const ctx = createToolContext(grid, color, settings, selectionMask);
  tool.onPointerUp(ctx, from, to);
}

export function applyBrushStraightLine(
  grid: PixelGrid,
  color: PixelColor,
  settings: ToolSettings,
  from: Point,
  to: Point,
  selectionMask?: SelectionMask | null,
): void {
  const ctx = createToolContext(grid, color, settings, selectionMask);
  const session = new PixelPerfectStrokeSession();
  paintBrushStraightLine(ctx, from, to, session);
}
