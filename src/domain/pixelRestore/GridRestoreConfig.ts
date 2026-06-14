import type { CropRect } from "@/domain/layer/Layer";
import type { GridMergeAlgorithm } from "./GridMergeAlgorithm";
import { DEFAULT_GRID_MERGE_ALGORITHM } from "./GridMergeAlgorithm";

export interface GridRestoreConfig {
  seedCell: CropRect;
  algorithm: GridMergeAlgorithm;
}

export function createGridRestoreConfig(
  seedCell: CropRect,
  algorithm: GridMergeAlgorithm = DEFAULT_GRID_MERGE_ALGORITHM,
): GridRestoreConfig {
  return { seedCell, algorithm };
}
