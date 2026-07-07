import type { Point } from "../tool/ITool";

export type TransformHandle =
  | "topLeft"
  | "top"
  | "topRight"
  | "right"
  | "bottomRight"
  | "bottom"
  | "bottomLeft"
  | "left"
  | "rotate"
  | "move";

export interface TransformBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const TRANSFORM_HANDLE_SIZE = 6;
export const ROTATION_HANDLE_OFFSET_SCREEN_PX = 20;
export const ROTATION_SNAP_DEG = 5;

function hitThreshold(zoom: number): number {
  return Math.max(1, Math.ceil(TRANSFORM_HANDLE_SIZE / zoom / 2));
}

function isNearPoint(point: Point, target: Point, threshold: number): boolean {
  return (
    Math.abs(point.x - target.x) <= threshold &&
    Math.abs(point.y - target.y) <= threshold
  );
}

function inRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

export function getTransformHandleCursor(handle: TransformHandle): string {
  switch (handle) {
    case "topLeft":
    case "bottomRight":
      return "nwse-resize";
    case "topRight":
    case "bottomLeft":
      return "nesw-resize";
    case "top":
    case "bottom":
      return "ns-resize";
    case "left":
    case "right":
      return "ew-resize";
    case "rotate":
      return "grab";
    case "move":
      return "move";
  }
}

export function hitTestTransformHandleAtBounds(
  point: Point,
  bounds: TransformBounds,
  zoom: number,
): TransformHandle | null {
  if (bounds.width <= 0 || bounds.height <= 0) return null;

  const { x, y } = bounds;
  const right = x + bounds.width;
  const bottom = y + bounds.height;
  const threshold = hitThreshold(zoom);

  const corners: Array<{ id: TransformHandle; point: Point }> = [
    { id: "topLeft", point: { x, y } },
    { id: "topRight", point: { x: right, y } },
    { id: "bottomRight", point: { x: right, y: bottom } },
    { id: "bottomLeft", point: { x, y: bottom } },
  ];

  for (const corner of corners) {
    if (isNearPoint(point, corner.point, threshold)) {
      return corner.id;
    }
  }

  const rotatePoint = {
    x: x + bounds.width / 2,
    y: y - Math.round(ROTATION_HANDLE_OFFSET_SCREEN_PX / zoom),
  };
  if (isNearPoint(point, rotatePoint, threshold)) {
    return "rotate";
  }

  const edgeMinX = x + threshold;
  const edgeMaxX = right - threshold;
  const edgeMinY = y + threshold;
  const edgeMaxY = bottom - threshold;

  if (Math.abs(point.y - y) <= threshold && inRange(point.x, edgeMinX, edgeMaxX)) {
    return "top";
  }
  if (
    Math.abs(point.x - right) <= threshold &&
    inRange(point.y, edgeMinY, edgeMaxY)
  ) {
    return "right";
  }
  if (
    Math.abs(point.y - bottom) <= threshold &&
    inRange(point.x, edgeMinX, edgeMaxX)
  ) {
    return "bottom";
  }
  if (Math.abs(point.x - x) <= threshold && inRange(point.y, edgeMinY, edgeMaxY)) {
    return "left";
  }

  if (point.x >= x && point.x < right && point.y >= y && point.y < bottom) {
    return "move";
  }

  return null;
}

export function getTransformCenter(bounds: TransformBounds): Point {
  return {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
  };
}

export function computeRotationPointerAngle(center: Point, point: Point): number {
  return (Math.atan2(point.y - center.y, point.x - center.x) * 180) / Math.PI;
}

function normalizeRotationDelta(degrees: number): number {
  let normalized = degrees;
  while (normalized <= -180) normalized += 360;
  while (normalized > 180) normalized -= 360;
  return normalized;
}

export function snapRotationDegrees(degrees: number, shiftKey: boolean): number {
  if (!shiftKey) return degrees;
  return Math.round(degrees / ROTATION_SNAP_DEG) * ROTATION_SNAP_DEG;
}

export function computeRotationAngleDelta(
  center: Point,
  startAngle: number,
  current: Point,
  shiftKey: boolean,
): number {
  const currentAngle = computeRotationPointerAngle(center, current);
  const delta = normalizeRotationDelta(currentAngle - startAngle);
  return snapRotationDegrees(delta, shiftKey);
}
