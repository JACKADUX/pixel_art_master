import type { CropRect, ImageSize } from "@/domain/layer/Layer";
import type { GridMergeAlgorithm } from "@/domain/pixelRestore/GridMergeAlgorithm";
import {
  applyGridRestoreToGrid,
  validateGridRestore,
  type GridLayout,
} from "@/domain/pixelRestore/GridRestoreOperations";
import {
  applyRegionGridRestoreToGrid,
  validateRegionGridRestore,
  type RegionGridLayout,
} from "@/domain/pixelRestore/RegionGridRestoreOperations";
import { pixelGridToImageData } from "@/infrastructure/image/PixelGridCodec";

export interface GridRestoreResult {
  resultImageData: ImageData;
  outputSize: ImageSize;
  layout: GridLayout | RegionGridLayout;
}

export function validateGridRestoreSeed(
  imageSize: ImageSize,
  seedCell: CropRect,
): GridLayout {
  return validateGridRestore(imageSize, seedCell);
}

export function validateRegionGridRestoreSeed(
  innerRegion: CropRect,
  columns: number,
  rows: number,
): RegionGridLayout {
  return validateRegionGridRestore(innerRegion, columns, rows);
}

export function applyGridRestore(
  imageData: ImageData,
  seedCell: CropRect,
  algorithm: GridMergeAlgorithm,
): GridRestoreResult {
  const imageSize = { width: imageData.width, height: imageData.height };
  const { grid, layout } = applyGridRestoreToGrid(
    imageData.data,
    imageSize,
    seedCell,
    algorithm,
  );
  const resultImageData = pixelGridToImageData(grid);
  return {
    resultImageData,
    layout,
    outputSize: { width: layout.outputWidth, height: layout.outputHeight },
  };
}

export function applyRegionGridRestore(
  imageData: ImageData,
  innerRegion: CropRect,
  columns: number,
  rows: number,
  algorithm: GridMergeAlgorithm,
): GridRestoreResult {
  const imageSize = { width: imageData.width, height: imageData.height };
  const { grid, layout } = applyRegionGridRestoreToGrid(
    imageData.data,
    imageSize,
    innerRegion,
    columns,
    rows,
    algorithm,
  );
  const resultImageData = pixelGridToImageData(grid);
  return {
    resultImageData,
    layout,
    outputSize: { width: layout.outputWidth, height: layout.outputHeight },
  };
}
