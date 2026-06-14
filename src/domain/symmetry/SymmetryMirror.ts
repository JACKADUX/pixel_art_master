import type { SymmetryConfig, SymmetryOrigin } from "./SymmetryConfig";
import { isSymmetryActive } from "./SymmetryConfig";

export interface MirrorPoint {
  x: number;
  y: number;
}

export function snapSymmetryOrigin(value: number): number {
  return Math.round(value * 2) / 2;
}

/** Axis position in pixel space (0.5 step). Integer = grid line, *.5 = pixel center. */
export function symmetryAxisCoord(origin: number): number {
  return snapSymmetryOrigin(origin);
}

/** Integer axis = grid line between pixels; half-integer axis = pixel center. */
export function mirrorPixelIndex(index: number, axis: number): number {
  const snapped = snapSymmetryOrigin(axis);
  const gridUnits = Math.round(snapped * 2);
  if (gridUnits % 2 === 0) {
    return Math.round(2 * snapped - index - 1);
  }
  const centerPixel = snapped - 0.5;
  return Math.round(2 * centerPixel - index);
}

export function symmetryAxisDisplayCoord(origin: number, zoom: number): number {
  return symmetryAxisCoord(origin) * zoom;
}

export function mirrorX(x: number, originX: number): number {
  return mirrorPixelIndex(x, originX);
}

export function mirrorY(y: number, originY: number): number {
  return mirrorPixelIndex(y, originY);
}

export function forEachSymmetricPoint(
  x: number,
  y: number,
  config: SymmetryConfig,
  callback: (mx: number, my: number) => void,
): void {
  if (!isSymmetryActive(config)) {
    callback(x, y);
    return;
  }

  const xs = config.horizontal ? [x, mirrorX(x, config.originX)] : [x];
  const ys = config.vertical ? [y, mirrorY(y, config.originY)] : [y];
  const seen = new Set<string>();

  for (const mx of xs) {
    for (const my of ys) {
      const key = `${mx},${my}`;
      if (seen.has(key)) continue;
      seen.add(key);
      callback(mx, my);
    }
  }
}

export function clampOriginToCanvas(
  origin: SymmetryOrigin,
  width: number,
  height: number,
): SymmetryOrigin {
  const maxX = Math.max(0, width - 1);
  const maxY = Math.max(0, height - 1);
  return {
    originX: Math.min(Math.max(origin.originX, 0), maxX),
    originY: Math.min(Math.max(origin.originY, 0), maxY),
  };
}

export type SymmetryAxisKind = "horizontal" | "vertical";

export function hitTestSymmetryAxis(
  pixelX: number,
  pixelY: number,
  config: SymmetryConfig,
  threshold: number,
): SymmetryAxisKind | null {
  if (!isSymmetryActive(config)) return null;

  const horizontalDistance = config.horizontal
    ? Math.abs(pixelX - symmetryAxisCoord(config.originX))
    : Number.POSITIVE_INFINITY;
  const verticalDistance = config.vertical
    ? Math.abs(pixelY - symmetryAxisCoord(config.originY))
    : Number.POSITIVE_INFINITY;

  const horizontalHit = horizontalDistance <= threshold;
  const verticalHit = verticalDistance <= threshold;

  if (horizontalHit && verticalHit) {
    return horizontalDistance <= verticalDistance ? "horizontal" : "vertical";
  }
  if (horizontalHit) return "horizontal";
  if (verticalHit) return "vertical";
  return null;
}

export function forEachSymmetricTransform(
  config: SymmetryConfig,
  callback: (transform: (point: MirrorPoint) => MirrorPoint) => void,
): void {
  if (!isSymmetryActive(config)) {
    callback((point) => point);
    return;
  }

  const variants: Array<{ horizontal: boolean; vertical: boolean }> = [{ horizontal: false, vertical: false }];
  if (config.horizontal) variants.push({ horizontal: true, vertical: false });
  if (config.vertical) variants.push({ horizontal: false, vertical: true });
  if (config.horizontal && config.vertical) variants.push({ horizontal: true, vertical: true });

  const seen = new Set<string>();
  for (const variant of variants) {
    const transform = (point: MirrorPoint): MirrorPoint => ({
      x: variant.horizontal ? mirrorX(point.x, config.originX) : point.x,
      y: variant.vertical ? mirrorY(point.y, config.originY) : point.y,
    });
    const probe = transform({ x: 0, y: 0 });
    const key = `${probe.x},${probe.y}`;
    if (seen.has(key)) continue;
    seen.add(key);
    callback(transform);
  }
}
