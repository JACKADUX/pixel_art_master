// Ellipse fill based on Aseprite's algo_ellipsefill (src/doc/algo.cpp, MIT license),
// which adapts Alois Zingl's Bresenham ellipse algorithm.

export interface EllipseBounds {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  hPixels: number;
  vPixels: number;
  h: number;
}

export function adjustEllipseArgs(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  hPixels: number,
  vPixels: number,
): EllipseBounds {
  let hx0 = x0;
  let hy0 = y0;
  let hx1 = x1;
  let hy1 = y1;
  let hPx = Math.max(hPixels, 0);
  let vPx = Math.max(vPixels, 0);

  if (hx0 > hx1) [hx0, hx1] = [hx1, hx0];
  if (hy0 > hy1) [hy0, hy1] = [hy1, hy0];

  const w = hx1 - hx0 + 1;
  const h = hy1 - hy0 + 1;
  const hDiameter = w - hPx;
  const vDiameter = h - vPx;

  if (w === 8 || w === 12 || w === 22) hPx++;
  if (h === 8 || h === 12 || h === 22) vPx++;

  hPx = hDiameter > 5 ? hPx : 0;
  vPx = vDiameter > 5 ? vPx : 0;

  if (hDiameter % 2 === 0 && hDiameter > 5) hPx--;
  if (vDiameter % 2 === 0 && vDiameter > 5) vPx--;

  hx1 -= hPx;
  hy1 -= vPx;

  return { x0: hx0, y0: hy0, x1: hx1, y1: hy1, hPixels: hPx, vPixels: vPx, h };
}

export function forEachFilledEllipsePixel(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  hPixels: number,
  vPixels: number,
  callback: (x: number, y: number) => void,
): void {
  const bounds = adjustEllipseArgs(x0, y0, x1, y1, hPixels, vPixels);
  let ex0 = bounds.x0;
  let ey0 = bounds.y0;
  let ex1 = bounds.x1;
  let ey1 = bounds.y1;
  const hPx = bounds.hPixels;
  const vPx = bounds.vPixels;
  const h = bounds.h;

  let a = Math.abs(ex1 - ex0);
  let b = Math.abs(ey1 - ey0);
  let b1 = b & 1;
  let dx = 4 * (1.0 - a) * b * b;
  let dy = 4 * (b1 + 1) * a * a;
  let err = dx + dy + b1 * a * a;

  ey0 += ((b + 1) / 2) | 0;
  ey1 = ey0 - b1;
  a = 8 * a * a;
  b1 = 8 * b * b;

  const initialY0 = ey0;
  const initialY1 = ey1;
  const initialX0 = ex0;
  const initialX1 = ex1 + hPx;

  const fillHLine = (xStart: number, y: number, xEnd: number): void => {
    const minX = Math.min(xStart, xEnd);
    const maxX = Math.max(xStart, xEnd);
    for (let x = minX; x <= maxX; x++) {
      callback(x, y);
    }
  };

  do {
    fillHLine(ex0, ey0 + vPx, ex1 + hPx);
    fillHLine(ex0, ey1, ex1 + hPx);

    const e2 = 2 * err;
    if (e2 <= dy) {
      ey0++;
      ey1--;
      dy += a;
      err += dy;
    }
    if (e2 >= dx || 2 * err > dy) {
      ex0++;
      ex1--;
      dx += b1;
      err += dx;
    }
  } while (ex0 <= ex1);

  while (ey0 + vPx - ey1 + 1 < h) {
    ey0++;
    ey1--;
    fillHLine(ex0 - 1, ey0 + vPx, ex0 - 1);
    fillHLine(ex1 + 1 + hPx, ey0 + vPx, ex1 + 1 + hPx);
    fillHLine(ex0 - 1, ey1, ex0 - 1);
    fillHLine(ex1 + 1 + hPx, ey1, ex1 + 1 + hPx);
  }

  if (vPx > 0) {
    for (let i = initialY1 + 1; i < initialY0 + vPx; i++) {
      fillHLine(initialX0, i, initialX1);
    }
  }
}

export function collectCircleStampOffsets(size: number): ReadonlyArray<readonly [number, number]> {
  if (size === 1) return [[0, 0]];

  const half = Math.floor(size / 2);
  const pixels = new Map<string, readonly [number, number]>();

  forEachFilledEllipsePixel(0, 0, size - 1, size - 1, 0, 0, (x, y) => {
    const dx = x - half;
    const dy = y - half;
    const key = `${dx},${dy}`;
    if (!pixels.has(key)) {
      pixels.set(key, [dx, dy]);
    }
  });

  return [...pixels.values()];
}

export function forEachCircleStampPixel(
  size: number,
  callback: (dx: number, dy: number) => void,
): void {
  for (const [dx, dy] of collectCircleStampOffsets(size)) {
    callback(dx, dy);
  }
}
