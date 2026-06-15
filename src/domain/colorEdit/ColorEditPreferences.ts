import {
  clampOklabMergeThreshold,
  DEFAULT_OKLAB_MERGE_THRESHOLD,
} from "./OklabMergeDistance";
import {
  DEFAULT_OKLAB_REDUCE_ALGORITHM,
  parseOklabReduceAlgorithm,
  type OklabReduceAlgorithm,
} from "./OklabReduceAlgorithm";

export interface ColorEditPreferences {
  oklabMergeThreshold: number;
  oklabReduceAlgorithm: OklabReduceAlgorithm;
}

export const COLOR_EDIT_PREFERENCES_VERSION = 7;

export const DEFAULT_COLOR_EDIT_PREFERENCES: ColorEditPreferences = {
  oklabMergeThreshold: DEFAULT_OKLAB_MERGE_THRESHOLD,
  oklabReduceAlgorithm: DEFAULT_OKLAB_REDUCE_ALGORITHM,
};

export interface ColorEditPreferencesSource {
  oklabMergeThreshold: number;
  oklabReduceAlgorithm: OklabReduceAlgorithm;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parseColorEditPreferences(raw: unknown): ColorEditPreferences {
  const defaults = DEFAULT_COLOR_EDIT_PREFERENCES;
  if (!isRecord(raw)) return { ...defaults };

  return {
    oklabMergeThreshold: clampOklabMergeThreshold(
      typeof raw.oklabMergeThreshold === "number"
        ? raw.oklabMergeThreshold
        : defaults.oklabMergeThreshold,
    ),
    oklabReduceAlgorithm: parseOklabReduceAlgorithm(raw.oklabReduceAlgorithm),
  };
}

export function extractColorEditPreferences(
  source: ColorEditPreferencesSource,
): ColorEditPreferences {
  return {
    oklabMergeThreshold: clampOklabMergeThreshold(source.oklabMergeThreshold),
    oklabReduceAlgorithm: parseOklabReduceAlgorithm(source.oklabReduceAlgorithm),
  };
}
