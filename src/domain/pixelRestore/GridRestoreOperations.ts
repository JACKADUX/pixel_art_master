import { PixelGrid } from "@/domain/canvas/PixelGrid";
import type { PixelColor } from "@/domain/canvas/PixelColor";
import type { CropRect, ImageSize } from "@/domain/layer/Layer";
import type { GridMergeAlgorithm } from "./GridMergeAlgorithm";
import {
  getCenterPriorityInnerBounds,
  shouldApplyCenterPriority,
  type GridMergeCenterPriority,
} from "./GridMergeCenterPriority";
import { mergeCellColors } from "./GridMergeOperations";

export interface GridLayout {
  seedCell: CropRect;
  columnStart: number;
  rowStart: number;
  columns: number;
  rows: number;
  outputWidth: number;
  outputHeight: number;
}

export interface GridCellRect {
  x: number;
  y: number;
  width: number;
  height: number;
  column: number;
  row: number;
}

export function computeGridLayout(
  imageSize: ImageSize,
  seedCell: CropRect,
): GridLayout | null {
  if (seedCell.width < 1 || seedCell.height < 1) return null;

  const columnStart = Math.floor((0 - seedCell.x) / seedCell.width);
  const columnEnd = Math.ceil((imageSize.width - seedCell.x) / seedCell.width) - 1;
  const rowStart = Math.floor((0 - seedCell.y) / seedCell.height);
  const rowEnd = Math.ceil((imageSize.height - seedCell.y) / seedCell.height) - 1;
  const columns = columnEnd - columnStart + 1;
  const rows = rowEnd - rowStart + 1;

  if (columns < 1 || rows < 1) return null;

  return {
    seedCell,
    columnStart,
    rowStart,
    columns,
    rows,
    outputWidth: columns,
    outputHeight: rows,
  };
}

/** 覆盖整张原图的网格线索引（含种子左上以外的区域）。 */
export function computeGridOverlayLineIndices(
  origin: number,
  cellSize: number,
  imageSize: number,
): number[] {
  if (cellSize < 1) return [];
  const startIndex = Math.floor((0 - origin) / cellSize);
  const endIndex = Math.ceil((imageSize - origin) / cellSize);
  const indices: number[] = [];
  for (let index = startIndex; index <= endIndex; index++) {
    indices.push(index);
  }
  return indices;
}

export function getGridCellRect(layout: GridLayout, column: number, row: number): GridCellRect {
  return {
    x: layout.seedCell.x + column * layout.seedCell.width,
    y: layout.seedCell.y + row * layout.seedCell.height,
    width: layout.seedCell.width,
    height: layout.seedCell.height,
    column,
    row,
  };
}

export function intersectCellWithImage(
  cell: GridCellRect,
  imageSize: ImageSize,
): GridCellRect | null {
  const x = Math.max(0, cell.x);
  const y = Math.max(0, cell.y);
  const right = Math.min(imageSize.width, cell.x + cell.width);
  const bottom = Math.min(imageSize.height, cell.y + cell.height);
  const width = right - x;
  const height = bottom - y;
  if (width <= 0 || height <= 0) return null;
  return { ...cell, x, y, width, height };
}

export function isValidGridSeed(imageSize: ImageSize, seedCell: CropRect): boolean {
  return computeGridLayout(imageSize, seedCell) !== null;
}

export function validateGridRestore(imageSize: ImageSize, seedCell: CropRect): GridLayout {
  const layout = computeGridLayout(imageSize, seedCell);
  if (!layout) {
    throw new Error(
      `Invalid grid seed ${seedCell.width}×${seedCell.height} at (${seedCell.x}, ${seedCell.y}) for image ${imageSize.width}×${imageSize.height}`,
    );
  }
  return layout;
}

function readPixelColor(
  data: Uint8ClampedArray,
  imageWidth: number,
  x: number,
  y: number,
): PixelColor {
  const offset = (y * imageWidth + x) * 4;
  const r = data[offset];
  const g = data[offset + 1];
  const b = data[offset + 2];
  const a = data[offset + 3];
  return ((a & 0xff) << 24) | ((b & 0xff) << 16) | ((g & 0xff) << 8) | (r & 0xff);
}

export function collectCellColors(
  data: Uint8ClampedArray,
  imageWidth: number,
  cell: GridCellRect,
  centerPriority?: GridMergeCenterPriority,
): PixelColor[] {
  const colors: PixelColor[] = [];
  let startX = cell.x;
  let startY = cell.y;
  let endX = cell.x + cell.width;
  let endY = cell.y + cell.height;

  if (shouldApplyCenterPriority(centerPriority)) {
    const bounds = getCenterPriorityInnerBounds(
      cell.width,
      cell.height,
      centerPriority!.excludeRingCount,
    );
    startX += bounds.insetLeft;
    startY += bounds.insetTop;
    endX = startX + bounds.innerWidth;
    endY = startY + bounds.innerHeight;
  }

  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      colors.push(readPixelColor(data, imageWidth, x, y));
    }
  }
  return colors;
}

export function applyGridRestoreToGrid(
  data: Uint8ClampedArray,
  imageSize: ImageSize,
  seedCell: CropRect,
  algorithm: GridMergeAlgorithm,
  centerPriority?: GridMergeCenterPriority,
): { grid: PixelGrid; layout: GridLayout } {
  const layout = validateGridRestore(imageSize, seedCell);
  const grid = PixelGrid.createEmpty(layout.outputWidth, layout.outputHeight);

  for (let row = layout.rowStart; row < layout.rowStart + layout.rows; row++) {
    for (let col = layout.columnStart; col < layout.columnStart + layout.columns; col++) {
      const cell = intersectCellWithImage(getGridCellRect(layout, col, row), imageSize);
      if (!cell) continue;

      const colors = collectCellColors(data, imageSize.width, cell, centerPriority);
      if (colors.length === 0) continue;

      grid.setPixel(
        col - layout.columnStart,
        row - layout.rowStart,
        mergeCellColors(colors, algorithm),
      );
    }
  }

  return { grid, layout };
}
