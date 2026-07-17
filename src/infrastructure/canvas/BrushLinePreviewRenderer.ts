import type { PixelColor } from "@/domain/canvas/PixelColor";
import { getAlpha, toRgbaComponents } from "@/domain/canvas/PixelColor";
import { forEachStampPixel } from "@/domain/tool/BrushStamp";
import { forEachBrushLinePreviewCenter } from "@/domain/tool/BrushStroke";
import type { Point } from "@/domain/tool/ITool";
import type { ToolSettings } from "@/domain/tool/ToolType";
import {
  type CanvasScreenTransform,
  logicalToScreenX,
  logicalToScreenY,
} from "@/domain/viewport/CanvasScreenTransform";

interface GridBounds {
  width: number;
  height: number;
}

function pixelColorToCss(color: PixelColor): string {
  const { r, g, b, a } = toRgbaComponents(color);
  return `rgba(${r}, ${g}, ${b}, ${a / 255})`;
}

export function renderBrushLinePreview(
  ctx: CanvasRenderingContext2D,
  from: Point,
  to: Point,
  settings: Pick<ToolSettings, "brushSize" | "brushShape">,
  color: PixelColor,
  transform: CanvasScreenTransform,
  _bounds: GridBounds,
): void {
  ctx.imageSmoothingEnabled = false;

  if (getAlpha(color) === 0) return;

  const { brushSize: size, brushShape: shape } = settings;
  const filled = new Set<string>();
  const cell = transform.zoom;

  ctx.fillStyle = pixelColorToCss(color);

  forEachBrushLinePreviewCenter(from, to, settings, (center) => {
    forEachStampPixel(center, size, shape, (x, y) => {
      const key = `${x},${y}`;
      if (filled.has(key)) return;
      filled.add(key);
      ctx.fillRect(logicalToScreenX(x, transform), logicalToScreenY(y, transform), cell, cell);
    });
  });
}
