import type { PixelGrid } from "@/domain/canvas/PixelGrid";
import { wrapWithMask } from "@/domain/canvas/MaskedPixelGrid";
import { wrapWithSymmetry } from "@/domain/canvas/SymmetricPixelSurface";
import type { PixelColor } from "@/domain/canvas/PixelColor";
import type { SelectionMask } from "@/domain/selection/SelectionMask";
import type { SymmetryConfig } from "@/domain/symmetry/SymmetryConfig";
import { paintBrushStraightLine } from "@/domain/tool/BrushStroke";
import { PixelPerfectStrokeSession } from "@/domain/tool/PixelPerfectStroke";
import { getTool } from "@/domain/tool/ToolRegistry";
import type { Point, ToolContext, PixelSurface } from "@/domain/tool/ITool";
import type { ToolSettings, DrawingToolType } from "@/domain/tool/ToolType";

function createToolContext(
  grid: PixelGrid,
  color: PixelColor,
  settings: ToolSettings,
  selectionMask?: SelectionMask | null,
  symmetry?: SymmetryConfig | null,
): ToolContext {
  let surface: PixelSurface = selectionMask ? wrapWithMask(grid, selectionMask) : grid;
  surface = wrapWithSymmetry(surface, symmetry) as PixelSurface;
  return { grid: surface, color, settings, selectionMask: selectionMask ?? null };
}

export function applyToolPointerDown(
  grid: PixelGrid,
  toolType: DrawingToolType,
  color: PixelColor,
  settings: ToolSettings,
  point: Point,
  selectionMask?: SelectionMask | null,
  symmetry?: SymmetryConfig | null,
): void {
  const tool = getTool(toolType);
  const ctx = createToolContext(grid, color, settings, selectionMask, symmetry);
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
  symmetry?: SymmetryConfig | null,
): void {
  const tool = getTool(toolType);
  const ctx = createToolContext(grid, color, settings, selectionMask, symmetry);
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
  symmetry?: SymmetryConfig | null,
): void {
  const tool = getTool(toolType);
  const ctx = createToolContext(grid, color, settings, selectionMask, symmetry);
  tool.onPointerUp(ctx, from, to);
}

export function applyBrushStraightLine(
  grid: PixelGrid,
  color: PixelColor,
  settings: ToolSettings,
  from: Point,
  to: Point,
  selectionMask?: SelectionMask | null,
  symmetry?: SymmetryConfig | null,
): void {
  const ctx = createToolContext(grid, color, settings, selectionMask, symmetry);
  const session = new PixelPerfectStrokeSession();
  paintBrushStraightLine(ctx, from, to, session);
}
