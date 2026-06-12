export type LinePixelCallback = (x: number, y: number) => void;

/**
 * Continuous Bresenham line (Aseprite algo_line_continuous).
 * Visits every pixel along an 8-connected path from (x0,y0) to (x1,y1).
 */
export function forEachContinuousLinePixel(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  callback: LinePixelCallback,
): void {
  let dx = Math.abs(x1 - x0);
  const sx = x0 < x1 ? 1 : -1;
  let dy = -Math.abs(y1 - y0);
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;

  for (;;) {
    callback(x0, y0);
    const e2 = 2 * err;
    if (e2 >= dy) {
      if (x0 === x1) break;
      err += dy;
      x0 += sx;
    }
    if (e2 <= dx) {
      if (y0 === y1) break;
      err += dx;
      y0 += sy;
    }
  }
}

/**
 * Continuous Bresenham with corner fix for thick brush stamps
 * (Aseprite algo_line_continuous_with_fix_for_line_brush).
 * When x and y change in the same step, an extra pixel is drawn at the corner.
 */
export function forEachContinuousLinePixelWithBrushFix(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  callback: LinePixelCallback,
): void {
  let dx = Math.abs(x1 - x0);
  const sx = x0 < x1 ? 1 : -1;
  let dy = -Math.abs(y1 - y0);
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;

  for (;;) {
    let xChanged = false;

    callback(x0, y0);
    const e2 = 2 * err;
    if (e2 >= dy) {
      if (x0 === x1) break;
      err += dy;
      x0 += sx;
      xChanged = true;
    }
    if (e2 <= dx) {
      if (y0 === y1) break;
      err += dx;
      if (xChanged) {
        callback(x0, y0);
      }
      y0 += sy;
    }
  }
}

/**
 * Walk a line segment, skipping the start point (already painted).
 */
export function forEachLineSegmentPixel(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  useBrushFix: boolean,
  callback: LinePixelCallback,
): void {
  const walk = useBrushFix
    ? forEachContinuousLinePixelWithBrushFix
    : forEachContinuousLinePixel;

  walk(fromX, fromY, toX, toY, (x, y) => {
    if (x === fromX && y === fromY) return;
    callback(x, y);
  });
}
