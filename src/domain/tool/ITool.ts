import type { PixelGrid } from "../canvas/PixelGrid";
import type { MaskedPixelGrid } from "../canvas/MaskedPixelGrid";
import type { SymmetricPixelSurface } from "../canvas/SymmetricPixelSurface";
import type { PixelColor } from "../canvas/PixelColor";
import type { SelectionMask } from "../selection/SelectionMask";
import type { ToolSettings } from "./ToolType";

export interface Point {
  x: number;
  y: number;
}

export type PixelSurface = PixelGrid | MaskedPixelGrid | SymmetricPixelSurface;

export interface ToolContext {
  grid: PixelSurface;
  color: PixelColor;
  settings: ToolSettings;
  selectionMask?: SelectionMask | null;
}

export interface ITool {
  readonly name: string;
  onPointerDown(ctx: ToolContext, point: Point): void;
  onPointerMove(ctx: ToolContext, from: Point, to: Point): void;
  onPointerUp(ctx: ToolContext, from: Point, to: Point): void;
}
