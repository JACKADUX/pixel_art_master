import type { PixelGrid } from "@/domain/canvas/PixelGrid";
import { getAlpha, type PixelColor } from "@/domain/canvas/PixelColor";
import type { Point } from "@/domain/tool/ITool";
import { forEachLineSegmentPixel } from "@/domain/tool/LineRasterization";
import { scalePixelGridNearest } from "./PatternBrushScale";
import { tintPatternPixel, type PatternDrawMode } from "./PatternBrushTint";

export interface PatternStampTarget {
  setPixel(x: number, y: number, color: PixelColor): void;
}

export interface PatternStampOptions {
  source: PixelGrid;
  scalePercent: number;
  drawMode: PatternDrawMode;
  foregroundColor: PixelColor;
  backgroundColor: PixelColor;
  applyForegroundTint: boolean;
  flipHorizontal?: boolean;
  flipVertical?: boolean;
}

function resolvePatternSourceCoords(
  width: number,
  height: number,
  x: number,
  y: number,
  flipHorizontal: boolean,
  flipVertical: boolean,
): { srcX: number; srcY: number } {
  return {
    srcX: flipHorizontal ? width - 1 - x : x,
    srcY: flipVertical ? height - 1 - y : y,
  };
}

export function computePatternTopLeft(
  center: Point,
  width: number,
  height: number,
): Point {
  return {
    x: center.x - Math.floor(width / 2),
    y: center.y - Math.floor(height / 2),
  };
}

function getScaledPattern(options: PatternStampOptions): PixelGrid | null {
  return scalePixelGridNearest(options.source, options.scalePercent);
}

export function stampPatternAt(
  grid: PatternStampTarget,
  center: Point,
  options: PatternStampOptions,
): void {
  const pattern = getScaledPattern(options);
  if (!pattern) return;

  const topLeft = computePatternTopLeft(center, pattern.width, pattern.height);
  const flipHorizontal = options.flipHorizontal ?? false;
  const flipVertical = options.flipVertical ?? false;

  for (let y = 0; y < pattern.height; y++) {
    for (let x = 0; x < pattern.width; x++) {
      const { srcX, srcY } = resolvePatternSourceCoords(
        pattern.width,
        pattern.height,
        x,
        y,
        flipHorizontal,
        flipVertical,
      );
      const sourcePixel = pattern.getPixel(srcX, srcY);
      if (getAlpha(sourcePixel) === 0) continue;
      const color = tintPatternPixel(
        sourcePixel,
        options.drawMode,
        options.foregroundColor,
        options.backgroundColor,
        options.applyForegroundTint,
      );
      const canvasX = topLeft.x + x;
      const canvasY = topLeft.y + y;
      if (getAlpha(color) === 0) {
        if (options.drawMode === "background") {
          grid.setPixel(canvasX, canvasY, color);
        }
        continue;
      }
      grid.setPixel(canvasX, canvasY, color);
    }
  }
}

export function stampPatternSegment(
  grid: PatternStampTarget,
  from: Point,
  to: Point,
  options: PatternStampOptions,
): void {
  forEachLineSegmentPixel(from.x, from.y, to.x, to.y, false, (x, y) => {
    stampPatternAt(grid, { x, y }, options);
  });
}
