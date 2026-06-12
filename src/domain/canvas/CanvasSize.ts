export interface CanvasSize {
  width: number;
  height: number;
}

export function createCanvasSize(width: number, height: number): CanvasSize {
  if (width <= 0 || height <= 0) {
    throw new Error("Canvas dimensions must be positive");
  }
  return { width, height };
}

export function pixelCount(size: CanvasSize): number {
  return size.width * size.height;
}
