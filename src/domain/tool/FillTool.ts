import { colorDistance, isTransparent, type PixelColor } from "../canvas/PixelColor";
import { isMaskSelected } from "../selection/SelectionMask";
import type { ITool, Point, ToolContext } from "./ITool";

/**
 * 判断两个像素是否属于"同一可填充区域"。
 * - 全透明像素一律视为相等(忽略其残留的 RGB),解决导入图片后透明空白填不满的问题。
 * - 其余情况按 RGBA 曼哈顿距离与容差比较。
 */
export function fillColorMatches(a: PixelColor, b: PixelColor, tolerance: number): boolean {
  if (isTransparent(a) && isTransparent(b)) return true;
  return colorDistance(a, b) <= tolerance;
}

export class FillTool implements ITool {
  readonly name = "填充";

  onPointerDown(ctx: ToolContext, point: Point): void {
    if (!ctx.grid.inBounds(point.x, point.y)) return;
    if (ctx.selectionMask && !isMaskSelected(ctx.selectionMask, point.x, point.y)) return;

    const tolerance = ctx.settings.fillTolerance;
    const contiguous = ctx.settings.fillContiguous;
    const target = ctx.grid.getPixel(point.x, point.y);
    if (fillColorMatches(target, ctx.color, tolerance)) return;

    if (contiguous) {
      this.fillContiguous(ctx, point, target, tolerance);
    } else {
      this.fillNonContiguous(ctx, target, tolerance);
    }
  }

  private fillContiguous(
    ctx: ToolContext,
    seed: Point,
    target: PixelColor,
    tolerance: number,
  ): void {
    const queue: Point[] = [seed];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      const key = `${current.x},${current.y}`;
      if (visited.has(key)) continue;
      visited.add(key);

      if (!ctx.grid.inBounds(current.x, current.y)) continue;
      if (ctx.selectionMask && !isMaskSelected(ctx.selectionMask, current.x, current.y)) continue;
      if (!fillColorMatches(ctx.grid.getPixel(current.x, current.y), target, tolerance)) continue;

      ctx.grid.setPixel(current.x, current.y, ctx.color);
      queue.push(
        { x: current.x + 1, y: current.y },
        { x: current.x - 1, y: current.y },
        { x: current.x, y: current.y + 1 },
        { x: current.x, y: current.y - 1 },
      );
    }
  }

  private fillNonContiguous(ctx: ToolContext, target: PixelColor, tolerance: number): void {
    for (let y = 0; y < ctx.grid.height; y++) {
      for (let x = 0; x < ctx.grid.width; x++) {
        if (ctx.selectionMask && !isMaskSelected(ctx.selectionMask, x, y)) continue;
        if (!fillColorMatches(ctx.grid.getPixel(x, y), target, tolerance)) continue;
        ctx.grid.setPixel(x, y, ctx.color);
      }
    }
  }

  onPointerMove(): void {}
  onPointerUp(): void {}
}
