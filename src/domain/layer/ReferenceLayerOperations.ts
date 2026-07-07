import type { CanvasSize } from "../canvas/CanvasSize";
import type { BoardPosition } from "../pixelCanvas/PixelCanvas";
import { DEFAULT_BOARD_POSITION } from "../pixelCanvas/PixelCanvas";
import type {
  CropRect,
  ImageSize,
  LayerPosition,
  ReferenceGridConfig,
  ReferenceLayer,
} from "./Layer";
import { createEmptyReferenceLayer } from "./Layer";

export const REFERENCE_SCALE_MIN = 0.1;
export const REFERENCE_SCALE_MAX = 20;

export function clampReferenceScale(scale: number): number {
  if (!Number.isFinite(scale)) return 1;
  return Math.max(REFERENCE_SCALE_MIN, Math.min(scale, REFERENCE_SCALE_MAX));
}

export function clampCropRect(crop: CropRect, imageSize: ImageSize): CropRect {
  const x = Math.max(0, Math.min(Math.floor(crop.x), imageSize.width - 1));
  const y = Math.max(0, Math.min(Math.floor(crop.y), imageSize.height - 1));
  const maxWidth = imageSize.width - x;
  const maxHeight = imageSize.height - y;
  const width = Math.max(1, Math.min(Math.floor(crop.width), maxWidth));
  const height = Math.max(1, Math.min(Math.floor(crop.height), maxHeight));
  return { x, y, width, height };
}

export function fullImageCrop(imageSize: ImageSize): CropRect {
  return { x: 0, y: 0, width: imageSize.width, height: imageSize.height };
}

export function centerReferencePosition(
  crop: CropRect,
  canvasSize: CanvasSize,
): LayerPosition {
  return {
    x: Math.floor((canvasSize.width - crop.width) / 2),
    y: Math.floor((canvasSize.height - crop.height) / 2),
  };
}

/** 将画板局部坐标转换为工作区（画板）绝对坐标 */
export function canvasPointToBoardPoint(
  canvasPoint: LayerPosition,
  canvasBoardPosition: BoardPosition,
): LayerPosition {
  return {
    x: canvasPoint.x + canvasBoardPosition.x,
    y: canvasPoint.y + canvasBoardPosition.y,
  };
}

/** 将工作区绝对坐标转换为画板局部坐标 */
export function boardPointToCanvasPoint(
  boardPoint: LayerPosition,
  canvasBoardPosition: BoardPosition,
): LayerPosition {
  return {
    x: boardPoint.x - canvasBoardPosition.x,
    y: boardPoint.y - canvasBoardPosition.y,
  };
}

/** 在指定画板内居中，返回工作区绝对坐标 */
export function centerReferenceBoardPosition(
  crop: CropRect,
  canvasSize: CanvasSize,
  canvasBoardPosition: BoardPosition = DEFAULT_BOARD_POSITION,
): LayerPosition {
  const centered = centerReferencePosition(crop, canvasSize);
  return {
    x: canvasBoardPosition.x + centered.x,
    y: canvasBoardPosition.y + centered.y,
  };
}

export function getReferenceDisplaySize(layer: ReferenceLayer): ImageSize | null {
  if (!layer.crop) return null;
  const scale = clampReferenceScale(layer.scale);
  return {
    width: layer.crop.width * scale,
    height: layer.crop.height * scale,
  };
}

export function getReferenceBounds(
  layer: ReferenceLayer,
  zoom: number,
): {
  left: number;
  top: number;
  width: number;
  height: number;
} | null {
  const displaySize = getReferenceDisplaySize(layer);
  if (!displaySize || !layer.visible) return null;
  return {
    left: layer.position.x * zoom,
    top: layer.position.y * zoom,
    width: displaySize.width * zoom,
    height: displaySize.height * zoom,
  };
}

export function setReferenceImage(
  layer: ReferenceLayer,
  imageData: string,
  imageSize: ImageSize,
  canvasSize: CanvasSize,
  canvasBoardPosition: BoardPosition = DEFAULT_BOARD_POSITION,
): ReferenceLayer {
  const crop = fullImageCrop(imageSize);
  return {
    ...layer,
    imageData,
    imageSize,
    crop,
    position: centerReferenceBoardPosition(crop, canvasSize, canvasBoardPosition),
    scale: 1,
  };
}

export function setReferenceCrop(
  layer: ReferenceLayer,
  crop: CropRect,
): ReferenceLayer {
  if (!layer.imageSize) return layer;
  return {
    ...layer,
    crop: clampCropRect(crop, layer.imageSize),
  };
}

export function setReferencePosition(
  layer: ReferenceLayer,
  position: LayerPosition,
): ReferenceLayer {
  return { ...layer, position };
}

export function moveReferencePosition(
  layer: ReferenceLayer,
  delta: LayerPosition,
): ReferenceLayer {
  return {
    ...layer,
    position: {
      x: layer.position.x + delta.x,
      y: layer.position.y + delta.y,
    },
  };
}

export function setReferenceScale(
  layer: ReferenceLayer,
  scale: number,
): ReferenceLayer {
  return { ...layer, scale: clampReferenceScale(scale) };
}

export function resetReferenceScale(layer: ReferenceLayer): ReferenceLayer {
  return { ...layer, scale: 1 };
}

export function toggleReferencePaletteVisibility(
  layer: ReferenceLayer,
): ReferenceLayer {
  return { ...layer, paletteVisible: !layer.paletteVisible };
}

export function setReferenceGrid(
  layer: ReferenceLayer,
  grid: ReferenceGridConfig,
): ReferenceLayer {
  return { ...layer, grid };
}

export function toggleReferenceGridVisibility(
  layer: ReferenceLayer,
): ReferenceLayer {
  return {
    ...layer,
    grid: { ...layer.grid, visible: !layer.grid.visible },
  };
}

export function addEmptyReferenceLayer(
  layers: import("./Layer").Layer[],
  name?: string,
): import("./Layer").Layer[] {
  const newLayer = createEmptyReferenceLayer(name);
  return [newLayer, ...layers];
}

export function updateReferenceLayer(
  layers: import("./Layer").Layer[],
  layerId: string,
  updater: (layer: ReferenceLayer) => ReferenceLayer,
): import("./Layer").Layer[] {
  return layers.map((l) =>
    l.id === layerId && l.type === "reference" ? updater(l) : l,
  );
}
