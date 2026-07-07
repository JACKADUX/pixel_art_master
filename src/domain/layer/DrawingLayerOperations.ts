import type { CanvasSize } from "../canvas/CanvasSize";
import type { Point } from "../tool/ITool";
import type { SelectionRect } from "../selection/SelectionRect";
import type { DrawingLayer, Layer, LayerPosition } from "./Layer";
import { resizeLayerPixels } from "./LayerOperations";
import { isDrawingLayer } from "./LayerTypeGuards";
export function getDrawingLayerSize(layer: DrawingLayer): CanvasSize {
  return { width: layer.width, height: layer.height };
}

export function canvasToLayerPoint(
  canvasPoint: Point,
  position: LayerPosition,
): Point {
  return {
    x: canvasPoint.x - position.x,
    y: canvasPoint.y - position.y,
  };
}

export function layerToCanvasPoint(
  layerPoint: Point,
  position: LayerPosition,
): Point {
  return {
    x: layerPoint.x + position.x,
    y: layerPoint.y + position.y,
  };
}

export function canMoveDrawingLayer(layer: DrawingLayer): boolean {
  return !layer.locked;
}

export function moveDrawingLayerPosition(
  layer: DrawingLayer,
  delta: LayerPosition,
): DrawingLayer {
  return {
    ...layer,
    position: {
      x: layer.position.x + delta.x,
      y: layer.position.y + delta.y,
    },
  };
}

export function getDrawingLayerCanvasBounds(layer: DrawingLayer): SelectionRect {
  return {
    x: layer.position.x,
    y: layer.position.y,
    width: layer.width,
    height: layer.height,
  };
}

export function validateDrawingLayer(layer: DrawingLayer): void {
  const expected = layer.width * layer.height;
  if (layer.pixels.length !== expected) {
    throw new Error(
      `Drawing layer "${layer.name}" pixel buffer size mismatch: expected ${expected}, got ${layer.pixels.length}`,
    );
  }
}

export function normalizeDrawingLayer(layer: DrawingLayer, canvasSize: CanvasSize): DrawingLayer {
  if (
    layer.width !== undefined &&
    layer.height !== undefined &&
    layer.position !== undefined &&
    layer.pixels.length === layer.width * layer.height
  ) {
    return layer;
  }

  return {
    ...layer,
    width: layer.width ?? canvasSize.width,
    height: layer.height ?? canvasSize.height,
    position: layer.position ?? { x: 0, y: 0 },
    pixels:
      layer.pixels.length === (layer.width ?? canvasSize.width) * (layer.height ?? canvasSize.height)
        ? layer.pixels
        : layer.pixels.slice(0, canvasSize.width * canvasSize.height),
  };
}

/** 计算画布放大后，图层为覆盖新画布所需的最小尺寸。 */
export function computeExpandedLayerSize(
  layer: DrawingLayer,
  newCanvas: CanvasSize,
): CanvasSize {
  return {
    width: Math.max(layer.width, newCanvas.width - layer.position.x),
    height: Math.max(layer.height, newCanvas.height - layer.position.y),
  };
}

/** 画布放大时扩展绘制层 buffer；缩小或尺寸不变时原样返回。 */
export function expandDrawingLayerForCanvasGrow(
  layer: DrawingLayer,
  oldCanvas: CanvasSize,
  newCanvas: CanvasSize,
): DrawingLayer {
  const isGrowing =
    newCanvas.width > oldCanvas.width || newCanvas.height > oldCanvas.height;
  if (!isGrowing) {
    return layer;
  }

  const targetSize = computeExpandedLayerSize(layer, newCanvas);
  if (
    targetSize.width <= layer.width &&
    targetSize.height <= layer.height
  ) {
    return layer;
  }

  const oldSize = { width: layer.width, height: layer.height };
  return {
    ...layer,
    width: targetSize.width,
    height: targetSize.height,
    pixels: resizeLayerPixels(layer.pixels, oldSize, targetSize),
  };
}

export function expandDrawingLayersForCanvasGrow(
  layers: Layer[],
  oldCanvas: CanvasSize,
  newCanvas: CanvasSize,
): Layer[] {
  return layers.map((layer) =>
    isDrawingLayer(layer)
      ? expandDrawingLayerForCanvasGrow(layer, oldCanvas, newCanvas)
      : layer,
  );
}

export function drawingLayerContainsCanvasPoint(
  layer: DrawingLayer,
  canvasPoint: Point,
): boolean {
  const localX = canvasPoint.x - layer.position.x;
  const localY = canvasPoint.y - layer.position.y;
  return (
    localX >= 0 &&
    localY >= 0 &&
    localX < layer.width &&
    localY < layer.height
  );
}

/** 扩展图层 buffer，使给定画布坐标均可写入。支持向左/上扩展（同时调整 position）。 */
export function expandDrawingLayerToIncludeCanvasPoint(
  layer: DrawingLayer,
  canvasPoint: Point,
): DrawingLayer {
  return expandDrawingLayerToIncludeCanvasPoints(layer, [canvasPoint]);
}

export function expandDrawingLayerToIncludeCanvasPoints(
  layer: DrawingLayer,
  canvasPoints: readonly Point[],
): DrawingLayer {
  if (canvasPoints.length === 0) return layer;

  let minLocalX = 0;
  let minLocalY = 0;
  let maxLocalX = layer.width - 1;
  let maxLocalY = layer.height - 1;

  for (const canvasPoint of canvasPoints) {
    const localX = canvasPoint.x - layer.position.x;
    const localY = canvasPoint.y - layer.position.y;
    minLocalX = Math.min(minLocalX, localX);
    minLocalY = Math.min(minLocalY, localY);
    maxLocalX = Math.max(maxLocalX, localX);
    maxLocalY = Math.max(maxLocalY, localY);
  }

  const padLeft = minLocalX < 0 ? -minLocalX : 0;
  const padTop = minLocalY < 0 ? -minLocalY : 0;
  const padRight = maxLocalX >= layer.width ? maxLocalX - layer.width + 1 : 0;
  const padBottom = maxLocalY >= layer.height ? maxLocalY - layer.height + 1 : 0;

  if (padLeft === 0 && padTop === 0 && padRight === 0 && padBottom === 0) {
    return layer;
  }

  const newWidth = layer.width + padLeft + padRight;
  const newHeight = layer.height + padTop + padBottom;
  const newPixels = new Uint32Array(newWidth * newHeight);

  for (let y = 0; y < layer.height; y++) {
    for (let x = 0; x < layer.width; x++) {
      const srcIdx = y * layer.width + x;
      const dstIdx = (y + padTop) * newWidth + (x + padLeft);
      newPixels[dstIdx] = layer.pixels[srcIdx];
    }
  }

  return {
    ...layer,
    width: newWidth,
    height: newHeight,
    position: {
      x: layer.position.x - padLeft,
      y: layer.position.y - padTop,
    },
    pixels: newPixels,
  };
}

/** 扩展图层以覆盖整个画布区域（用于填充等需要遍历画布的工具）。 */
export function expandDrawingLayerToCoverCanvas(
  layer: DrawingLayer,
  canvasSize: CanvasSize,
): DrawingLayer {
  if (canvasSize.width <= 0 || canvasSize.height <= 0) return layer;
  return expandDrawingLayerToIncludeCanvasPoints(layer, [
    { x: 0, y: 0 },
    { x: canvasSize.width - 1, y: canvasSize.height - 1 },
  ]);
}
