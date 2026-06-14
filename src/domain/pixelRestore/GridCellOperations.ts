import type { CropRect, ImageSize } from "@/domain/layer/Layer";
import { clampCropRect } from "@/domain/layer/ReferenceLayerOperations";

const MIN_CELL = 1;

function snapCellRect(rect: CropRect): CropRect {
  return {
    x: Math.floor(rect.x),
    y: Math.floor(rect.y),
    width: Math.max(MIN_CELL, Math.floor(rect.width)),
    height: Math.max(MIN_CELL, Math.floor(rect.height)),
  };
}

export function normalizeSeedRect(
  start: { x: number; y: number },
  end: { x: number; y: number },
): CropRect {
  const x = Math.min(Math.floor(start.x), Math.floor(end.x));
  const y = Math.min(Math.floor(start.y), Math.floor(end.y));
  const width = Math.max(MIN_CELL, Math.abs(Math.floor(end.x) - Math.floor(start.x)));
  const height = Math.max(MIN_CELL, Math.abs(Math.floor(end.y) - Math.floor(start.y)));
  return { x, y, width, height };
}

export function adjustSeedTopLeft(
  current: CropRect,
  dx: number,
  dy: number,
  imageSize: ImageSize,
): CropRect {
  const bottomRightX = current.x + current.width;
  const bottomRightY = current.y + current.height;
  let x = current.x + dx;
  let y = current.y + dy;
  x = Math.min(x, bottomRightX - MIN_CELL);
  y = Math.min(y, bottomRightY - MIN_CELL);
  return snapCellRect(
    clampCropRect(
      {
        x,
        y,
        width: bottomRightX - x,
        height: bottomRightY - y,
      },
      imageSize,
    ),
  );
}

export function adjustSeedBottomRight(
  current: CropRect,
  dx: number,
  dy: number,
  imageSize: ImageSize,
): CropRect {
  return snapCellRect(
    clampCropRect(
      {
        x: current.x,
        y: current.y,
        width: Math.max(MIN_CELL, current.width + dx),
        height: Math.max(MIN_CELL, current.height + dy),
      },
      imageSize,
    ),
  );
}

export type SeedCornerHandle = "topLeft" | "bottomRight";

export const SEED_CORNER_HANDLE_SIZE_PX = 8;

export function hitTestSeedCornerHandle(
  point: { x: number; y: number },
  seed: CropRect,
  zoom: number,
): SeedCornerHandle | null {
  const threshold = Math.max(1, Math.ceil(SEED_CORNER_HANDLE_SIZE_PX / zoom / 2));
  const bottomRightX = seed.x + seed.width;
  const bottomRightY = seed.y + seed.height;

  if (
    Math.abs(point.x - seed.x) <= threshold &&
    Math.abs(point.y - seed.y) <= threshold
  ) {
    return "topLeft";
  }

  if (
    Math.abs(point.x - bottomRightX) <= threshold &&
    Math.abs(point.y - bottomRightY) <= threshold
  ) {
    return "bottomRight";
  }

  return null;
}

export function resizeSeedFromCornerHandle(
  current: CropRect,
  handle: SeedCornerHandle,
  point: { x: number; y: number },
  imageSize: ImageSize,
): CropRect {
  if (handle === "bottomRight") {
    return snapCellRect(
      clampCropRect(
        {
          x: current.x,
          y: current.y,
          width: Math.max(MIN_CELL, Math.floor(point.x) - current.x),
          height: Math.max(MIN_CELL, Math.floor(point.y) - current.y),
        },
        imageSize,
      ),
    );
  }

  const bottomRightX = current.x + current.width;
  const bottomRightY = current.y + current.height;
  const x = Math.min(Math.floor(point.x), bottomRightX - MIN_CELL);
  const y = Math.min(Math.floor(point.y), bottomRightY - MIN_CELL);
  return snapCellRect(
    clampCropRect(
      {
        x,
        y,
        width: bottomRightX - x,
        height: bottomRightY - y,
      },
      imageSize,
    ),
  );
}
