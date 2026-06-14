import type { PixelGrid } from "../canvas/PixelGrid";
import { PixelGrid as PG } from "../canvas/PixelGrid";
import type { SelectionRect } from "../selection/SelectionRect";
import { normalizeRect } from "../selection/SelectionRect";

export type AssetCaptureSource = "activeLayer" | "composite";

export type AssetCapturePhase = "idle" | "dragging" | "adjusting";

const MIN_CAPTURE_SIZE = 1;

export function extractRectFromGrid(grid: PixelGrid, rect: SelectionRect): PixelGrid | null {
  if (rect.width <= 0 || rect.height <= 0) return null;

  const x0 = Math.max(0, rect.x);
  const y0 = Math.max(0, rect.y);
  const x1 = Math.min(grid.width, rect.x + rect.width);
  const y1 = Math.min(grid.height, rect.y + rect.height);
  const width = x1 - x0;
  const height = y1 - y0;
  if (width <= 0 || height <= 0) return null;

  const result = PG.createEmpty(width, height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      result.setPixel(x, y, grid.getPixel(x0 + x, y0 + y));
    }
  }
  return result;
}

export function normalizeCaptureRect(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
): SelectionRect {
  return normalizeRect(fromX, fromY, toX, toY);
}

export function clampCaptureRectToBounds(
  rect: SelectionRect,
  canvasWidth: number,
  canvasHeight: number,
): SelectionRect {
  const x = Math.max(0, Math.min(rect.x, canvasWidth - MIN_CAPTURE_SIZE));
  const y = Math.max(0, Math.min(rect.y, canvasHeight - MIN_CAPTURE_SIZE));
  const maxWidth = canvasWidth - x;
  const maxHeight = canvasHeight - y;
  const width = Math.max(MIN_CAPTURE_SIZE, Math.min(rect.width, maxWidth));
  const height = Math.max(MIN_CAPTURE_SIZE, Math.min(rect.height, maxHeight));
  return { x, y, width, height };
}

export function adjustCaptureRectTopLeft(
  rect: SelectionRect,
  dx: number,
  dy: number,
  canvasWidth: number,
  canvasHeight: number,
): SelectionRect {
  const bottomRightX = rect.x + rect.width;
  const bottomRightY = rect.y + rect.height;
  let x = rect.x + dx;
  let y = rect.y + dy;
  x = Math.max(0, Math.min(x, bottomRightX - MIN_CAPTURE_SIZE));
  y = Math.max(0, Math.min(y, bottomRightY - MIN_CAPTURE_SIZE));
  const adjusted = {
    x,
    y,
    width: bottomRightX - x,
    height: bottomRightY - y,
  };
  return clampCaptureRectToBounds(adjusted, canvasWidth, canvasHeight);
}

export function adjustCaptureRectBottomRight(
  rect: SelectionRect,
  dx: number,
  dy: number,
  canvasWidth: number,
  canvasHeight: number,
): SelectionRect {
  const maxWidth = canvasWidth - rect.x;
  const maxHeight = canvasHeight - rect.y;
  const width = Math.max(
    MIN_CAPTURE_SIZE,
    Math.min(rect.width + dx, maxWidth),
  );
  const height = Math.max(
    MIN_CAPTURE_SIZE,
    Math.min(rect.height + dy, maxHeight),
  );
  return { x: rect.x, y: rect.y, width, height };
}
