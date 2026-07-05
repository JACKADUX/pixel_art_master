import {
  MAX_CANVAS_DIMENSION,
  MIN_CANVAS_DIMENSION,
  type CanvasSize,
} from "./CanvasSize";

export type AspectChangedSide = "width" | "height";

export function computeAspectRatio(width: number, height: number): number {
  if (height <= 0) return 1;
  return width / height;
}

function clampDimension(value: number): number {
  return Math.min(
    MAX_CANVAS_DIMENSION,
    Math.max(MIN_CANVAS_DIMENSION, Math.round(value)),
  );
}

export function computeAspectLockedSize(
  changedSide: AspectChangedSide,
  newValue: number,
  ratio: number,
): CanvasSize {
  const clamped = clampDimension(newValue);

  if (changedSide === "width") {
    const height = clampDimension(clamped / ratio);
    return { width: clamped, height };
  }

  const width = clampDimension(clamped * ratio);
  return { width, height: clamped };
}
