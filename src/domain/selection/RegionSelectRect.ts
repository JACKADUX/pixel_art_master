import type { CropRect, ImageSize } from "@/domain/layer/Layer";
import { clampCropRect } from "@/domain/layer/ReferenceLayerOperations";

/**
 * 图像查看器「区域选框」的纯几何运算。
 *
 * 与像素还原插件的基准格选框（GridCellOperations）保持一致的交互语义，
 * 但不耦合像素还原领域：这里只描述「在一张图像上选取一块矩形区域」这一通用概念，
 * 因此放在 selection 领域中以便被任意图像预览场景复用。
 */

const MIN_SIZE = 1;

/** 选框四角句柄。拖拽任意角点都可调整选框尺寸。 */
export type RegionCornerHandle =
  | "topLeft"
  | "topRight"
  | "bottomLeft"
  | "bottomRight";

/** 角点句柄的屏幕尺寸（CSS 像素），命中判定按缩放折算回图像像素。 */
export const REGION_HANDLE_SIZE_PX = 8;

/** 由拖拽起点与终点归一化出整数对齐的选框矩形。 */
export function normalizeRegionRect(
  start: { x: number; y: number },
  end: { x: number; y: number },
): CropRect {
  const x = Math.min(Math.floor(start.x), Math.floor(end.x));
  const y = Math.min(Math.floor(start.y), Math.floor(end.y));
  const width = Math.max(MIN_SIZE, Math.abs(Math.floor(end.x) - Math.floor(start.x)));
  const height = Math.max(MIN_SIZE, Math.abs(Math.floor(end.y) - Math.floor(start.y)));
  return { x, y, width, height };
}

/** 方向键平移选框：保持尺寸不变，整体移动并限制在图像范围内。 */
export function moveRegionRect(
  rect: CropRect,
  dx: number,
  dy: number,
  imageSize: ImageSize,
): CropRect {
  const maxX = Math.max(0, imageSize.width - rect.width);
  const maxY = Math.max(0, imageSize.height - rect.height);
  const x = Math.max(0, Math.min(rect.x + dx, maxX));
  const y = Math.max(0, Math.min(rect.y + dy, maxY));
  return { x, y, width: rect.width, height: rect.height };
}

/** Shift+方向键调整选框尺寸：固定左上角，伸缩右下角。 */
export function resizeRegionRect(
  rect: CropRect,
  dx: number,
  dy: number,
  imageSize: ImageSize,
): CropRect {
  return clampCropRect(
    {
      x: rect.x,
      y: rect.y,
      width: Math.max(MIN_SIZE, rect.width + dx),
      height: Math.max(MIN_SIZE, rect.height + dy),
    },
    imageSize,
  );
}

/** 命中测试：判断指针是否落在某个角点句柄上。 */
export function hitTestRegionCornerHandle(
  point: { x: number; y: number },
  rect: CropRect,
  zoom: number,
): RegionCornerHandle | null {
  const threshold = Math.max(1, Math.ceil(REGION_HANDLE_SIZE_PX / zoom / 2));
  const left = rect.x;
  const top = rect.y;
  const right = rect.x + rect.width;
  const bottom = rect.y + rect.height;

  const near = (a: number, b: number) => Math.abs(a - b) <= threshold;
  const nearX = (target: number) => near(point.x, target);
  const nearY = (target: number) => near(point.y, target);

  if (nearX(left) && nearY(top)) return "topLeft";
  if (nearX(right) && nearY(top)) return "topRight";
  if (nearX(left) && nearY(bottom)) return "bottomLeft";
  if (nearX(right) && nearY(bottom)) return "bottomRight";
  return null;
}

/** 拖拽角点句柄缩放选框：被拖拽角点跟随指针，对角保持不动。 */
export function resizeRegionFromCornerHandle(
  rect: CropRect,
  handle: RegionCornerHandle,
  point: { x: number; y: number },
  imageSize: ImageSize,
): CropRect {
  const px = Math.floor(point.x);
  const py = Math.floor(point.y);

  let left = rect.x;
  let top = rect.y;
  let right = rect.x + rect.width;
  let bottom = rect.y + rect.height;

  switch (handle) {
    case "topLeft":
      left = Math.min(px, right - MIN_SIZE);
      top = Math.min(py, bottom - MIN_SIZE);
      break;
    case "topRight":
      right = Math.max(px, left + MIN_SIZE);
      top = Math.min(py, bottom - MIN_SIZE);
      break;
    case "bottomLeft":
      left = Math.min(px, right - MIN_SIZE);
      bottom = Math.max(py, top + MIN_SIZE);
      break;
    case "bottomRight":
      right = Math.max(px, left + MIN_SIZE);
      bottom = Math.max(py, top + MIN_SIZE);
      break;
  }

  return clampCropRect(
    {
      x: left,
      y: top,
      width: Math.max(MIN_SIZE, right - left),
      height: Math.max(MIN_SIZE, bottom - top),
    },
    imageSize,
  );
}
