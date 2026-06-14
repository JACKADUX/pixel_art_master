import { getAlpha, rgba, toRgbComponents, TRANSPARENT, type PixelColor } from "../canvas/PixelColor";
import type { ColorMergeAnchor } from "./ColorMergeAnchor";
import {
  DEFAULT_COLOR_MERGE_OPTIONS,
  normalizeColorMergeOptions,
  type ColorMergeOptions,
} from "./ColorMergeOptions";
import { mergeVectorDistance, pixelToMergeVector, type MergeColorVector } from "./MergeColorVector";

interface PreparedAnchor {
  anchor: ColorMergeAnchor;
  vector: MergeColorVector;
}

function prepareAnchors(anchors: readonly ColorMergeAnchor[]): PreparedAnchor[] {
  return anchors.map((anchor) => ({
    anchor,
    vector: pixelToMergeVector(anchor.color),
  }));
}

function findMatchingAnchor(
  pixelVector: MergeColorVector,
  prepared: readonly PreparedAnchor[],
): ColorMergeAnchor | null {
  for (const { anchor, vector } of prepared) {
    if (mergeVectorDistance(pixelVector, vector) <= anchor.distance) {
      return anchor;
    }
  }
  return null;
}

export function mergePixelColor(
  color: PixelColor,
  prepared: readonly PreparedAnchor[],
  options: ColorMergeOptions = DEFAULT_COLOR_MERGE_OPTIONS,
): PixelColor {
  const normalized = normalizeColorMergeOptions(options);
  const alpha = getAlpha(color);
  if (alpha === 0) return color;

  const pixelVector = pixelToMergeVector(color);
  const match = findMatchingAnchor(pixelVector, prepared);
  if (!match) {
    return normalized.unmatchedPixelBehavior === "remove" ? TRANSPARENT : color;
  }

  const { r, g, b } = toRgbComponents(match.color);
  const matchedAlpha = getAlpha(match.color);
  return rgba(r, g, b, matchedAlpha === 255 ? alpha : matchedAlpha);
}

export function applyColorMerge(
  imageData: ImageData,
  anchors: readonly ColorMergeAnchor[],
  options: ColorMergeOptions = DEFAULT_COLOR_MERGE_OPTIONS,
): ImageData {
  const normalized = normalizeColorMergeOptions(options);
  const prepared = prepareAnchors(anchors);
  const { width, height, data } = imageData;
  const resultData = new Uint8ClampedArray(data.length);

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha === 0) {
      resultData[i] = 0;
      resultData[i + 1] = 0;
      resultData[i + 2] = 0;
      resultData[i + 3] = 0;
      continue;
    }

    const color = rgba(data[i], data[i + 1], data[i + 2], alpha);
    const merged =
      prepared.length === 0
        ? color
        : mergePixelColor(color, prepared, normalized);
    const { r, g, b } = toRgbComponents(merged);
    const mergedAlpha = getAlpha(merged);
    resultData[i] = r;
    resultData[i + 1] = g;
    resultData[i + 2] = b;
    resultData[i + 3] = mergedAlpha;
  }

  return { width, height, data: resultData } as ImageData;
}

export function reorderAnchors(
  anchors: readonly ColorMergeAnchor[],
  fromIndex: number,
  toIndex: number,
): ColorMergeAnchor[] {
  if (fromIndex < 0 || fromIndex >= anchors.length || fromIndex === toIndex) {
    return [...anchors];
  }

  const clampedTo = Math.max(0, Math.min(toIndex, anchors.length));
  if (fromIndex === clampedTo) {
    return [...anchors];
  }

  const next = [...anchors];
  const [moved] = next.splice(fromIndex, 1);
  const insertAt = fromIndex < clampedTo ? clampedTo - 1 : clampedTo;
  next.splice(insertAt, 0, moved);
  return next;
}
