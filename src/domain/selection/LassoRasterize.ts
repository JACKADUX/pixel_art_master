import type { Point } from "../tool/ITool";
import { createEmptyMask, setMaskPixel, type SelectionMask } from "./SelectionMask";

export function createLassoMask(
  points: Point[],
  canvasWidth: number,
  canvasHeight: number,
): SelectionMask {
  const mask = createEmptyMask(canvasWidth, canvasHeight);
  if (points.length < 3) return mask;

  const closed = [...points];
  if (closed.length > 0) {
    const first = closed[0];
    const last = closed[closed.length - 1];
    if (first.x !== last.x || first.y !== last.y) {
      closed.push({ ...first });
    }
  }

  let minY = canvasHeight;
  let maxY = 0;
  for (const p of closed) {
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  minY = Math.max(0, minY);
  maxY = Math.min(canvasHeight - 1, maxY);

  for (let y = minY; y <= maxY; y++) {
    const intersections: number[] = [];
    for (let i = 0; i < closed.length - 1; i++) {
      const p1 = closed[i];
      const p2 = closed[i + 1];
      if (p1.y === p2.y) continue;

      const yMin = Math.min(p1.y, p2.y);
      const yMax = Math.max(p1.y, p2.y);
      if (y < yMin || y >= yMax) continue;

      const t = (y + 0.5 - p1.y) / (p2.y - p1.y);
      const x = p1.x + t * (p2.x - p1.x);
      intersections.push(x);
    }

    intersections.sort((a, b) => a - b);
    for (let i = 0; i + 1 < intersections.length; i += 2) {
      const startX = Math.ceil(intersections[i]);
      const endX = Math.floor(intersections[i + 1]);
      for (let x = startX; x <= endX; x++) {
        if (x >= 0 && x < canvasWidth) {
          setMaskPixel(mask, x, y, true);
        }
      }
    }
  }

  return mask;
}

export function shouldAppendLassoPoint(
  points: Point[],
  next: Point,
  minDistance = 1,
): boolean {
  if (points.length === 0) return true;
  const last = points[points.length - 1];
  const dx = next.x - last.x;
  const dy = next.y - last.y;
  return dx * dx + dy * dy >= minDistance * minDistance;
}
