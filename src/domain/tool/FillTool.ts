import { colorsEqual } from "../canvas/PixelColor";
import { isMaskSelected } from "../selection/SelectionMask";
import type { ITool, Point, ToolContext } from "./ITool";

export class FillTool implements ITool {
  readonly name = "填充";

  onPointerDown(ctx: ToolContext, point: Point): void {
    if (!ctx.grid.inBounds(point.x, point.y)) return;
    if (ctx.selectionMask && !isMaskSelected(ctx.selectionMask, point.x, point.y)) return;

    const target = ctx.grid.getPixel(point.x, point.y);
    if (colorsEqual(target, ctx.color)) return;

    const queue: Point[] = [point];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      const key = `${current.x},${current.y}`;
      if (visited.has(key)) continue;
      visited.add(key);

      if (!ctx.grid.inBounds(current.x, current.y)) continue;
      if (ctx.selectionMask && !isMaskSelected(ctx.selectionMask, current.x, current.y)) continue;
      if (!colorsEqual(ctx.grid.getPixel(current.x, current.y), target)) continue;

      ctx.grid.setPixel(current.x, current.y, ctx.color);
      queue.push(
        { x: current.x + 1, y: current.y },
        { x: current.x - 1, y: current.y },
        { x: current.x, y: current.y + 1 },
        { x: current.x, y: current.y - 1 },
      );
    }
  }

  onPointerMove(): void {}
  onPointerUp(): void {}
}
