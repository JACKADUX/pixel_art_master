import type { PixelGrid } from "../canvas/PixelGrid";
import type { LayerProjectedSurface } from "../canvas/LayerProjectedSurface";
import type { MaskedPixelGrid } from "../canvas/MaskedPixelGrid";
import type { SymmetricPixelSurface } from "../canvas/SymmetricPixelSurface";
import type { TiledPixelSurface } from "../canvas/TiledPixelSurface";
import type { PixelColor } from "../canvas/PixelColor";
import type { PatternDrawMode } from "../patternBrush/PatternBrushTint";
import type { SelectionMask } from "../selection/SelectionMask";
import type { ToolSettings } from "./ToolType";

export interface Point {
  x: number;
  y: number;
}

export interface PointerModifiers {
  shiftKey: boolean;
  altKey: boolean;
}

export const DEFAULT_POINTER_MODIFIERS: PointerModifiers = {
  shiftKey: false,
  altKey: false,
};

export type PixelSurface =
  | PixelGrid
  | LayerProjectedSurface
  | MaskedPixelGrid
  | SymmetricPixelSurface
  | TiledPixelSurface;

export interface PatternStampContext {
  source: PixelGrid;
  drawMode: PatternDrawMode;
  foregroundColor: PixelColor;
  backgroundColor: PixelColor;
  applyForegroundTint: boolean;
}

export interface ToolContext {
  grid: PixelSurface;
  color: PixelColor;
  settings: ToolSettings;
  modifiers: PointerModifiers;
  selectionMask?: SelectionMask | null;
  patternStamp?: PatternStampContext | null;
}

export interface ITool {
  readonly name: string;
  onPointerDown(ctx: ToolContext, point: Point): void;
  onPointerMove(ctx: ToolContext, from: Point, to: Point): void;
  onPointerUp(ctx: ToolContext, from: Point, to: Point): void;
}
