import type { PixelColor } from "../canvas/PixelColor";
import {
  clampOklabMergeThreshold,
  DEFAULT_OKLAB_MERGE_THRESHOLD,
} from "./OklabMergeDistance";

export interface ManualMergeAnchor {
  id: string;
  color: PixelColor;
  threshold: number;
}

export function createManualMergeAnchor(
  color: PixelColor,
  threshold: number = DEFAULT_OKLAB_MERGE_THRESHOLD,
): ManualMergeAnchor {
  return normalizeManualMergeAnchor({
    id: crypto.randomUUID(),
    color,
    threshold,
  });
}

export function normalizeManualMergeAnchor(anchor: ManualMergeAnchor): ManualMergeAnchor {
  return {
    id: anchor.id,
    color: anchor.color,
    threshold: clampOklabMergeThreshold(anchor.threshold),
  };
}
