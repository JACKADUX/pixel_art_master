import type { PixelGrid } from "@/domain/canvas/PixelGrid";
import { wrapWithMask } from "@/domain/canvas/MaskedPixelGrid";
import { wrapWithSymmetry } from "@/domain/canvas/SymmetricPixelSurface";
import { wrapWithTile } from "@/domain/canvas/TiledPixelSurface";
import type { SelectionRect } from "@/domain/selection/SelectionRect";
import type { PixelColor } from "@/domain/canvas/PixelColor";
import type { SelectionMask } from "@/domain/selection/SelectionMask";
import type { SymmetryConfig } from "@/domain/symmetry/SymmetryConfig";
import { paintBrushStraightLine } from "@/domain/tool/BrushStroke";
import { PixelPerfectStrokeSession } from "@/domain/tool/PixelPerfectStroke";
import { getTool } from "@/domain/tool/ToolRegistry";
import type { Point, ToolContext, PixelSurface, PatternStampContext } from "@/domain/tool/ITool";
import type { ToolSettings, DrawingToolType } from "@/domain/tool/ToolType";

export interface DrawToolOptions {
  patternStamp?: PatternStampContext | null;
  tileRegion?: SelectionRect | null;
}

function createToolContext(
  grid: PixelGrid,
  color: PixelColor,
  settings: ToolSettings,
  selectionMask?: SelectionMask | null,
  symmetry?: SymmetryConfig | null,
  options?: DrawToolOptions,
): ToolContext {
  let surface: PixelSurface = selectionMask ? wrapWithMask(grid, selectionMask) : grid;
  if (options?.tileRegion) {
    surface = wrapWithTile(surface, options.tileRegion) as PixelSurface;
  } else {
    surface = wrapWithSymmetry(surface, symmetry) as PixelSurface;
  }
  return {
    grid: surface,
    color,
    settings,
    selectionMask: selectionMask ?? null,
    patternStamp: options?.patternStamp ?? null,
  };
}

export function applyToolPointerDown(
  grid: PixelGrid,
  toolType: DrawingToolType,
  color: PixelColor,
  settings: ToolSettings,
  point: Point,
  selectionMask?: SelectionMask | null,
  symmetry?: SymmetryConfig | null,
  options?: DrawToolOptions,
): void {
  const tool = getTool(toolType);
  const ctx = createToolContext(grid, color, settings, selectionMask, symmetry, options);
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
  options?: DrawToolOptions,
): void {
  const tool = getTool(toolType);
  const ctx = createToolContext(grid, color, settings, selectionMask, symmetry, options);
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
  options?: DrawToolOptions,
): void {
  const tool = getTool(toolType);
  const ctx = createToolContext(grid, color, settings, selectionMask, symmetry, options);
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
  options?: DrawToolOptions,
): void {
  const ctx = createToolContext(grid, color, settings, selectionMask, symmetry, options);
  const session = new PixelPerfectStrokeSession();
  paintBrushStraightLine(ctx, from, to, session);
}
