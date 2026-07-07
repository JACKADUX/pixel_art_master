import { normalizeRect } from "../selection/SelectionRect";
import type { SelectionRect } from "../selection/SelectionRect";
import type { Point } from "./ITool";
import type { ShapeMode } from "./ToolType";

export interface ShapeDragModifiers {
  altKey: boolean;
}

export function resolveShapeDragCorners(
  origin: Point,
  pointer: Point,
  shapeMode: ShapeMode,
  modifiers: ShapeDragModifiers,
): { from: Point; to: Point } {
  if (!modifiers.altKey || shapeMode === "line") {
    return { from: origin, to: pointer };
  }

  const halfW = Math.abs(pointer.x - origin.x);
  const halfH = Math.abs(pointer.y - origin.y);
  return {
    from: { x: origin.x - halfW, y: origin.y - halfH },
    to: { x: origin.x + halfW, y: origin.y + halfH },
  };
}

export function shapeDragBoundingPoints(
  origin: Point,
  pointer: Point,
  shapeMode: ShapeMode,
  modifiers: ShapeDragModifiers,
): Point[] {
  const { from, to } = resolveShapeDragCorners(origin, pointer, shapeMode, modifiers);
  return [
    { x: Math.min(from.x, to.x), y: Math.min(from.y, to.y) },
    { x: Math.max(from.x, to.x), y: Math.max(from.y, to.y) },
  ];
}

export function shapeDragPreviewRect(
  origin: Point,
  pointer: Point,
  shapeMode: ShapeMode,
  modifiers: ShapeDragModifiers,
): SelectionRect {
  const { from, to } = resolveShapeDragCorners(origin, pointer, shapeMode, modifiers);
  return normalizeRect(from.x, from.y, to.x, to.y);
}
