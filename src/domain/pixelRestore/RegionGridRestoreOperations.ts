import { PixelGrid } from "@/domain/canvas/PixelGrid";
import type { CropRect, ImageSize } from "@/domain/layer/Layer";
import type { GridMergeAlgorithm } from "./GridMergeAlgorithm";
import type { GridMergeCenterPriority } from "./GridMergeCenterPriority";
import { collectCellColors, intersectCellWithImage } from "./GridRestoreOperations";
import { mergeCellColors } from "./GridMergeOperations";

/** 区域网格外围扩展的圈数（每边 1 格）。 */
export const REGION_OUTER_CELL_RING = 1;

export interface RegionGridLayout {
  /** 含外围格子的完整网格在源图上的范围。 */
  region: CropRect;
  /** 用户框选的内侧区域。 */
  innerRegion: CropRect;
  /** 内侧 X 方向网格数。 */
  columns: number;
  /** 内侧 Y 方向网格数。 */
  rows: number;
  /** 含外围圈的总列数 = columns + 2 * REGION_OUTER_CELL_RING。 */
  totalColumns: number;
  /** 含外围圈的总行数 = rows + 2 * REGION_OUTER_CELL_RING。 */
  totalRows: number;
  outputWidth: number;
  outputHeight: number;
}

export interface RegionGridCellRect extends CropRect {
  column: number;
  row: number;
}

const MIN_GRID_COUNT = 1;

export function clampGridCount(count: number, maxCount: number): number {
  const max = Math.max(MIN_GRID_COUNT, Math.floor(maxCount));
  if (!Number.isFinite(count)) return MIN_GRID_COUNT;
  const rounded = Math.round(count);
  return Math.min(Math.max(rounded, MIN_GRID_COUNT), max);
}

export function getRegionTotalGridCounts(
  innerColumns: number,
  innerRows: number,
): { totalColumns: number; totalRows: number } {
  return {
    totalColumns: innerColumns + REGION_OUTER_CELL_RING * 2,
    totalRows: innerRows + REGION_OUTER_CELL_RING * 2,
  };
}

/**
 * 将内侧 columns×rows 网格向外扩展各 1 格，使内侧区域对齐扩展网格的 [1..columns]×[1..rows] 单元。
 */
export function computeExpandedGridBounds(
  innerRegion: CropRect,
  innerColumns: number,
  innerRows: number,
): CropRect {
  const { totalColumns, totalRows } = getRegionTotalGridCounts(innerColumns, innerRows);
  const boundsWidth = Math.max(
    innerRegion.width,
    Math.round((innerRegion.width * totalColumns) / innerColumns),
  );
  const boundsHeight = Math.max(
    innerRegion.height,
    Math.round((innerRegion.height * totalRows) / innerRows),
  );

  const probe = { x: 0, y: 0, width: boundsWidth, height: boundsHeight };
  const innerAnchor = getRegionCellRect(probe, REGION_OUTER_CELL_RING, REGION_OUTER_CELL_RING, totalColumns, totalRows);

  return {
    x: innerRegion.x - innerAnchor.x,
    y: innerRegion.y - innerAnchor.y,
    width: boundsWidth,
    height: boundsHeight,
  };
}

export function getRegionCellRect(
  region: CropRect,
  column: number,
  row: number,
  columns: number,
  rows: number,
): RegionGridCellRect {
  const x0 = region.x + Math.floor((column * region.width) / columns);
  const x1 = region.x + Math.floor(((column + 1) * region.width) / columns);
  const y0 = region.y + Math.floor((row * region.height) / rows);
  const y1 = region.y + Math.floor(((row + 1) * region.height) / rows);

  return {
    x: x0,
    y: y0,
    width: Math.max(1, x1 - x0),
    height: Math.max(1, y1 - y0),
    column,
    row,
  };
}

export function isOuterRegionGridCell(
  column: number,
  row: number,
  totalColumns: number,
  totalRows: number,
): boolean {
  return (
    column === 0 ||
    row === 0 ||
    column === totalColumns - 1 ||
    row === totalRows - 1
  );
}

export function computeRegionGridLayout(
  innerRegion: CropRect,
  columns: number,
  rows: number,
): RegionGridLayout | null {
  if (innerRegion.width < 1 || innerRegion.height < 1) return null;

  const clampedColumns = clampGridCount(columns, innerRegion.width);
  const clampedRows = clampGridCount(rows, innerRegion.height);
  const { totalColumns, totalRows } = getRegionTotalGridCounts(clampedColumns, clampedRows);
  const region = computeExpandedGridBounds(innerRegion, clampedColumns, clampedRows);

  return {
    region,
    innerRegion,
    columns: clampedColumns,
    rows: clampedRows,
    totalColumns,
    totalRows,
    outputWidth: totalColumns,
    outputHeight: totalRows,
  };
}

export function validateRegionGridRestore(
  innerRegion: CropRect,
  columns: number,
  rows: number,
): RegionGridLayout {
  const layout = computeRegionGridLayout(innerRegion, columns, rows);
  if (!layout) {
    throw new Error(
      `Invalid region grid ${columns}×${rows} for region ${innerRegion.width}×${innerRegion.height} at (${innerRegion.x}, ${innerRegion.y})`,
    );
  }
  return layout;
}

export function applyRegionGridRestoreToGrid(
  data: Uint8ClampedArray,
  imageSize: ImageSize,
  innerRegion: CropRect,
  columns: number,
  rows: number,
  algorithm: GridMergeAlgorithm,
  centerPriority?: GridMergeCenterPriority,
): { grid: PixelGrid; layout: RegionGridLayout } {
  const layout = validateRegionGridRestore(innerRegion, columns, rows);
  const grid = PixelGrid.createEmpty(layout.outputWidth, layout.outputHeight);

  for (let row = 0; row < layout.totalRows; row++) {
    for (let col = 0; col < layout.totalColumns; col++) {
      const cell = intersectCellWithImage(
        getRegionCellRect(layout.region, col, row, layout.totalColumns, layout.totalRows),
        imageSize,
      );
      if (!cell) continue;

      const colors = collectCellColors(data, imageSize.width, cell, centerPriority);
      if (colors.length === 0) continue;
      grid.setPixel(col, row, mergeCellColors(colors, algorithm));
    }
  }

  return { grid, layout };
}
