import type { CanvasSize } from "./CanvasSize";
import {
  MAX_CANVAS_DIMENSION,
  MIN_CANVAS_DIMENSION,
} from "./CanvasSize";

export type CanvasResizeEdge = "right" | "bottom";

export const DEFAULT_CANVAS_RESIZE_STEP = 32;
export const MIN_CANVAS_RESIZE_STEP = 1;
export const MAX_CANVAS_RESIZE_STEP = 512;

function clampDimension(value: number): number {
  return Math.max(
    MIN_CANVAS_DIMENSION,
    Math.min(MAX_CANVAS_DIMENSION, Math.round(value)),
  );
}

export function resizeCanvasFromEdge(
  current: CanvasSize,
  edge: CanvasResizeEdge,
  delta: number,
): CanvasSize {
  if (edge === "right") {
    return {
      width: clampDimension(current.width + delta),
      height: current.height,
    };
  }
  return {
    width: current.width,
    height: clampDimension(current.height + delta),
  };
}

export function snapCanvasResizeDelta(
  delta: number,
  step: number,
  fixedStep: boolean,
): number {
  if (!fixedStep || step <= 0) return delta;
  return Math.round(delta / step) * step;
}

export function canvasResizeDeltaFromDrag(
  pixelDelta: number,
  zoom: number,
): number {
  if (zoom <= 0) return 0;
  return Math.round(pixelDelta / zoom);
}
