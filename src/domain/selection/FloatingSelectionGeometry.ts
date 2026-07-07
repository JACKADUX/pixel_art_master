import type { LayerPosition } from "../layer/Layer";
import type { Point } from "../tool/ITool";
import type { FloatingSelection } from "./FloatingSelection";

/** 浮动选区当前位置在画布上的对角点，用于扩展图层 buffer。 */
export function getFloatingSelectionCanvasCornerPoints(
  floating: FloatingSelection,
): Point[] {
  if (floating.pixels.width <= 0 || floating.pixels.height <= 0) return [];

  return [
    { x: floating.offset.x, y: floating.offset.y },
    {
      x: floating.offset.x + floating.pixels.width - 1,
      y: floating.offset.y + floating.pixels.height - 1,
    },
  ];
}

/** 浮动选区原始位置在画布上的对角点，用于取消移动时写回原位。 */
export function getFloatingRestoreCanvasCornerPoints(
  floating: FloatingSelection,
  layerPosition: LayerPosition,
): Point[] {
  if (floating.pixels.width <= 0 || floating.pixels.height <= 0) return [];

  const x = layerPosition.x + floating.originInLayer.x;
  const y = layerPosition.y + floating.originInLayer.y;

  return [
    { x, y },
    { x: x + floating.pixels.width - 1, y: y + floating.pixels.height - 1 },
  ];
}
