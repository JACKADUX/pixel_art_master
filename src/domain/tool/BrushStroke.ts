import { forEachStampPixel } from "./BrushStamp";
import {
  forEachContinuousLinePixel,
  forEachContinuousLinePixelWithBrushFix,
  forEachLineSegmentPixel,
} from "./LineRasterization";
import type { PixelPerfectStrokeSession } from "./PixelPerfectStroke";
import type { Point, ToolContext } from "./ITool";
import type { ToolSettings } from "./ToolType";

function stampBrushAt(ctx: ToolContext, point: Point): void {
  forEachStampPixel(point, ctx.settings.brushSize, ctx.settings.brushShape, (x, y) => {
    ctx.grid.setPixel(x, y, ctx.color);
  });
}

export function paintBrushAt(
  ctx: ToolContext,
  point: Point,
  session: PixelPerfectStrokeSession | null,
): void {
  const usePerfect = ctx.settings.brushPerfectPixel && ctx.settings.brushSize === 1;

  if (usePerfect && session) {
    session.tryRemoveCorner(ctx.grid, point);
    session.commitPixel(ctx.grid, point, ctx.color);
    return;
  }

  stampBrushAt(ctx, point);
}

export function paintBrushSegment(
  ctx: ToolContext,
  from: Point,
  to: Point,
  session: PixelPerfectStrokeSession | null,
): void {
  const usePerfect = ctx.settings.brushPerfectPixel && ctx.settings.brushSize === 1;
  const useBrushFix = ctx.settings.brushSize > 1;

  forEachLineSegmentPixel(from.x, from.y, to.x, to.y, useBrushFix, (x, y) => {
    const point = { x, y };
    if (usePerfect && session) {
      session.tryRemoveCorner(ctx.grid, point);
      session.commitPixel(ctx.grid, point, ctx.color);
    } else {
      stampBrushAt(ctx, point);
    }
  });
}

export function paintBrushStraightLine(
  ctx: ToolContext,
  from: Point,
  to: Point,
  session: PixelPerfectStrokeSession | null,
): void {
  if (session) {
    session.reset();
  }
  paintBrushAt(ctx, from, session);
  paintBrushSegment(ctx, from, to, session);
}

export function forEachBrushLinePreviewCenter(
  from: Point,
  to: Point,
  settings: Pick<ToolSettings, "brushSize" | "brushShape">,
  callback: (point: Point) => void,
): void {
  const useBrushFix = settings.brushSize > 1;
  const walk = useBrushFix
    ? forEachContinuousLinePixelWithBrushFix
    : forEachContinuousLinePixel;

  walk(from.x, from.y, to.x, to.y, (x, y) => {
    callback({ x, y });
  });
}
