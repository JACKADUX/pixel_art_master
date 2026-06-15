import {
  clampOklabMergeThreshold,
  DEFAULT_OKLAB_MERGE_THRESHOLD,
} from "./OklabMergeDistance";
import {
  DEFAULT_OKLAB_REDUCE_ALGORITHM,
  parseOklabReduceAlgorithm,
  type OklabReduceAlgorithm,
} from "./OklabReduceAlgorithm";

export interface OklabMergeOptions {
  threshold: number;
  reduceAlgorithm: OklabReduceAlgorithm;
}

export const DEFAULT_OKLAB_MERGE_OPTIONS: OklabMergeOptions = {
  threshold: DEFAULT_OKLAB_MERGE_THRESHOLD,
  reduceAlgorithm: DEFAULT_OKLAB_REDUCE_ALGORITHM,
};

export function normalizeOklabMergeOptions(
  options?: Partial<OklabMergeOptions>,
): OklabMergeOptions {
  const defaults = DEFAULT_OKLAB_MERGE_OPTIONS;
  return {
    threshold: clampOklabMergeThreshold(options?.threshold ?? defaults.threshold),
    reduceAlgorithm: parseOklabReduceAlgorithm(
      options?.reduceAlgorithm ?? defaults.reduceAlgorithm,
    ),
  };
}
