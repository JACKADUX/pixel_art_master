export interface CanvasSize {
  width: number;
  height: number;
}

export const MIN_CANVAS_DIMENSION = 1;
export const MAX_CANVAS_DIMENSION = 4096;

export function createCanvasSize(width: number, height: number): CanvasSize {
  if (
    width < MIN_CANVAS_DIMENSION ||
    height < MIN_CANVAS_DIMENSION ||
    width > MAX_CANVAS_DIMENSION ||
    height > MAX_CANVAS_DIMENSION
  ) {
    throw new Error(
      `Canvas dimensions must be between ${MIN_CANVAS_DIMENSION} and ${MAX_CANVAS_DIMENSION}`,
    );
  }
  return { width, height };
}

export function parseCanvasDimension(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const parsed = Number(trimmed);
  if (
    parsed < MIN_CANVAS_DIMENSION ||
    parsed > MAX_CANVAS_DIMENSION ||
    !Number.isInteger(parsed)
  ) {
    return null;
  }
  return parsed;
}

export function pixelCount(size: CanvasSize): number {
  return size.width * size.height;
}
