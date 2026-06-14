import type { PixelColor } from "../canvas/PixelColor";
import { toHexAlpha } from "../canvas/PixelColor";

export interface ColorMergeAnchor {
  id: string;
  color: PixelColor;
  distance: number;
}

export const DEFAULT_ANCHOR_DISTANCE = 0.25;
export const MIN_ANCHOR_DISTANCE = 0.05;
export const MAX_ANCHOR_DISTANCE = 1;

export function createColorMergeAnchor(
  color: PixelColor,
  distance = DEFAULT_ANCHOR_DISTANCE,
  id: string = crypto.randomUUID(),
): ColorMergeAnchor {
  return {
    id,
    color,
    distance: clampAnchorDistance(distance),
  };
}

export function clampAnchorDistance(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_ANCHOR_DISTANCE;
  return Math.min(MAX_ANCHOR_DISTANCE, Math.max(MIN_ANCHOR_DISTANCE, value));
}

export function anchorColorKey(color: PixelColor): string {
  return toHexAlpha(color);
}
