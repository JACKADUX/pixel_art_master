export type GridScaleType = "singleCell" | "region";

export const GRID_SCALE_TYPES: GridScaleType[] = ["singleCell", "region"];

export const GRID_SCALE_TYPE_LABELS: Record<GridScaleType, string> = {
  singleCell: "单像素",
  region: "区域像素",
};

export const DEFAULT_GRID_SCALE_TYPE: GridScaleType = "singleCell";
