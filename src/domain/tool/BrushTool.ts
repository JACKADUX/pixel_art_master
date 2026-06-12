import { forEachStampPixel } from "./BrushStamp";
import type { ITool, Point, ToolContext } from "./ITool";

function paintBrush(ctx: ToolContext, point: Point): void {
  forEachStampPixel(point, ctx.settings.brushSize, ctx.settings.brushShape, (x, y) => {
    ctx.grid.setPixel(x, y, ctx.color);
  });
}

export class BrushTool implements ITool {
  readonly name = "画笔";

  onPointerDown(ctx: ToolContext, point: Point): void {
    paintBrush(ctx, point);
  }

  onPointerMove(ctx: ToolContext, _from: Point, to: Point): void {
    paintBrush(ctx, to);
  }

  onPointerUp(): void {}
}
