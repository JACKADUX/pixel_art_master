import { TRANSPARENT } from "../canvas/PixelColor";
import { forEachStampPixel } from "./BrushStamp";
import type { ITool, Point, ToolContext } from "./ITool";

function erase(ctx: ToolContext, point: Point): void {
  forEachStampPixel(point, ctx.settings.eraserSize, ctx.settings.eraserShape, (x, y) => {
    ctx.grid.setPixel(x, y, TRANSPARENT);
  });
}

export class EraserTool implements ITool {
  readonly name = "橡皮";

  onPointerDown(ctx: ToolContext, point: Point): void {
    erase(ctx, point);
  }

  onPointerMove(ctx: ToolContext, _from: Point, to: Point): void {
    erase(ctx, to);
  }

  onPointerUp(): void {}
}
