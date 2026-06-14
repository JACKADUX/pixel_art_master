import type { PixelGrid } from "@/domain/canvas/PixelGrid";
import { getAlpha, toRgbaComponents, type PixelColor } from "@/domain/canvas/PixelColor";
import { computePatternTopLeft } from "@/domain/patternBrush/PatternBrushStamp";
import { scalePixelGridNearest } from "@/domain/patternBrush/PatternBrushScale";
import { tintPatternPixel } from "@/domain/patternBrush/PatternBrushTint";
import type { Point } from "@/domain/tool/ITool";

interface GridBounds {
  width: number;
  height: number;
}

function pixelColorToCss(color: PixelColor): string {
  const { r, g, b, a } = toRgbaComponents(color);
  return `rgba(${r}, ${g}, ${b}, ${a / 255})`;
}

export function renderPatternBrushPreview(
  ctx: CanvasRenderingContext2D,
  center: Point,
  source: PixelGrid,
  scalePercent: number,
  foregroundColor: PixelColor,
  applyForegroundTint: boolean,
  zoom: number,
  _bounds: GridBounds,
): void {
  const scaled = scalePixelGridNearest(source, scalePercent);
  if (!scaled) return;

  const topLeft = computePatternTopLeft(center, scaled.width, scaled.height);

  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = 0.75;

  for (let y = 0; y < scaled.height; y++) {
    for (let x = 0; x < scaled.width; x++) {
      const sourcePixel = scaled.getPixel(x, y);
      if (getAlpha(sourcePixel) === 0) continue;
      const tinted = tintPatternPixel(
        sourcePixel,
        "foreground",
        foregroundColor,
        foregroundColor,
        applyForegroundTint,
      );
      if (getAlpha(tinted) === 0) continue;
      ctx.fillStyle = pixelColorToCss(tinted);
      ctx.fillRect((topLeft.x + x) * zoom, (topLeft.y + y) * zoom, zoom, zoom);
    }
  }

  ctx.globalAlpha = 1;
}
