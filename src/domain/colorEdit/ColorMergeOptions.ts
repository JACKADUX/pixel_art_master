import type { UnmatchedPixelBehavior } from "./UnmatchedPixelBehavior";
import { DEFAULT_UNMATCHED_PIXEL_BEHAVIOR } from "./UnmatchedPixelBehavior";

export interface ColorMergeOptions {
  unmatchedPixelBehavior: UnmatchedPixelBehavior;
}

export const DEFAULT_COLOR_MERGE_OPTIONS: ColorMergeOptions = {
  unmatchedPixelBehavior: DEFAULT_UNMATCHED_PIXEL_BEHAVIOR,
};

export function normalizeColorMergeOptions(
  options: Partial<ColorMergeOptions> | undefined,
): ColorMergeOptions {
  return {
    unmatchedPixelBehavior:
      options?.unmatchedPixelBehavior ?? DEFAULT_COLOR_MERGE_OPTIONS.unmatchedPixelBehavior,
  };
}
