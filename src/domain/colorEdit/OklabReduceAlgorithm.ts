export type OklabReduceAlgorithm = "mode" | "highChroma";

export const DEFAULT_OKLAB_REDUCE_ALGORITHM: OklabReduceAlgorithm = "mode";

export const OKLAB_REDUCE_ALGORITHM_LABELS: Record<OklabReduceAlgorithm, string> = {
  mode: "众数",
  highChroma: "高色度",
};

export const OKLAB_REDUCE_ALGORITHMS: OklabReduceAlgorithm[] = ["mode", "highChroma"];

export function parseOklabReduceAlgorithm(value: unknown): OklabReduceAlgorithm {
  if (
    typeof value === "string" &&
    OKLAB_REDUCE_ALGORITHMS.includes(value as OklabReduceAlgorithm)
  ) {
    return value as OklabReduceAlgorithm;
  }
  return DEFAULT_OKLAB_REDUCE_ALGORITHM;
}
