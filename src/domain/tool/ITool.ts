import type { PixelGrid } from "../canvas/PixelGrid";
import type { PixelColor } from "../canvas/PixelColor";
import type { ToolSettings } from "./ToolType";

export interface Point {
  x: number;
  y: number;
}

export interface ToolContext {
  grid: PixelGrid;
  color: PixelColor;
  settings: ToolSettings;
}

export interface ITool {
  readonly name: string;
  onPointerDown(ctx: ToolContext, point: Point): void;
  onPointerMove(ctx: ToolContext, from: Point, to: Point): void;
  onPointerUp(ctx: ToolContext, from: Point, to: Point): void;
}
