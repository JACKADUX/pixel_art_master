export type GridMergeAlgorithm = "median" | "mode" | "average" | "topLeft";

export const DEFAULT_GRID_MERGE_ALGORITHM: GridMergeAlgorithm = "median";

export const GRID_MERGE_ALGORITHM_LABELS: Record<GridMergeAlgorithm, string> = {
  median: "中值",
  mode: "众数",
  average: "平均值",
  topLeft: "左上角",
};

export const GRID_MERGE_ALGORITHMS: GridMergeAlgorithm[] = [
  "median",
  "mode",
  "average",
  "topLeft",
];
