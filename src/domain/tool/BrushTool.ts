import type { ITool, Point, ToolContext } from "./ITool";

function paintBrush(ctx: ToolContext, point: Point): void {
  const size = ctx.settings.brushSize;
  const half = Math.floor(size / 2);
  for (let dy = -half; dy < size - half; dy++) {
    for (let dx = -half; dx < size - half; dx++) {
      ctx.grid.setPixel(point.x + dx, point.y + dy, ctx.color);
    }
  }
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
