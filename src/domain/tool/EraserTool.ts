import { TRANSPARENT } from "../canvas/PixelColor";
import type { ITool, Point, ToolContext } from "./ITool";

function erase(ctx: ToolContext, point: Point): void {
  const size = ctx.settings.brushSize;
  const half = Math.floor(size / 2);
  for (let dy = -half; dy < size - half; dy++) {
    for (let dx = -half; dx < size - half; dx++) {
      ctx.grid.setPixel(point.x + dx, point.y + dy, TRANSPARENT);
    }
  }
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
