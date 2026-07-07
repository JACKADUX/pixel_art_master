import { forEachFilledEllipsePixel, forEachOutlineEllipsePixel } from "../geometry/EllipseFill";
import { forEachContinuousLinePixel } from "./LineRasterization";
import { resolveShapeDragCorners } from "./ShapeDragGeometry";
import type { ITool, Point, ToolContext } from "./ITool";

function setPixel(ctx: ToolContext, x: number, y: number): void {
  ctx.grid.setPixel(x, y, ctx.color);
}

function drawLine(ctx: ToolContext, x0: number, y0: number, x1: number, y1: number): void {
  forEachContinuousLinePixel(x0, y0, x1, y1, (x, y) => setPixel(ctx, x, y));
}

function drawRect(ctx: ToolContext, x0: number, y0: number, x1: number, y1: number, filled: boolean): void {
  const minX = Math.min(x0, x1);
  const maxX = Math.max(x0, x1);
  const minY = Math.min(y0, y1);
  const maxY = Math.max(y0, y1);

  if (filled) {
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        setPixel(ctx, x, y);
      }
    }
  } else {
    for (let x = minX; x <= maxX; x++) {
      setPixel(ctx, x, minY);
      setPixel(ctx, x, maxY);
    }
    for (let y = minY; y <= maxY; y++) {
      setPixel(ctx, minX, y);
      setPixel(ctx, maxX, y);
    }
  }
}

function drawEllipse(ctx: ToolContext, x0: number, y0: number, x1: number, y1: number, filled: boolean): void {
  const callback = (x: number, y: number) => setPixel(ctx, x, y);
  if (filled) {
    forEachFilledEllipsePixel(x0, y0, x1, y1, 0, 0, callback);
  } else {
    forEachOutlineEllipsePixel(x0, y0, x1, y1, 0, 0, callback);
  }
}

export class ShapeTool implements ITool {
  readonly name = "形状";
  private startPoint: Point | null = null;
  private snapshot: Uint32Array | null = null;

  onPointerDown(ctx: ToolContext, point: Point): void {
    this.startPoint = point;
    this.snapshot = ctx.grid.toUint32Array();
  }

  onPointerMove(ctx: ToolContext, _from: Point, to: Point): void {
    if (!this.startPoint || !this.snapshot) return;
    ctx.grid.restoreFrom(this.snapshot);
    const { from, to: end } = resolveShapeDragCorners(
      this.startPoint,
      to,
      ctx.settings.shapeMode,
      ctx.modifiers,
    );
    this.drawShape(ctx, from, end);
  }

  onPointerUp(ctx: ToolContext, from: Point, to: Point): void {
    if (this.snapshot) {
      ctx.grid.restoreFrom(this.snapshot);
    }
    const { from: start, to: end } = resolveShapeDragCorners(
      from,
      to,
      ctx.settings.shapeMode,
      ctx.modifiers,
    );
    this.drawShape(ctx, start, end);
    this.startPoint = null;
    this.snapshot = null;
  }

  private drawShape(ctx: ToolContext, from: Point, to: Point): void {
    const { shapeMode, shapeFilled } = ctx.settings;
    switch (shapeMode) {
      case "line":
        drawLine(ctx, from.x, from.y, to.x, to.y);
        break;
      case "rectangle":
        drawRect(ctx, from.x, from.y, to.x, to.y, shapeFilled);
        break;
      case "ellipse":
        drawEllipse(ctx, from.x, from.y, to.x, to.y, shapeFilled);
        break;
    }
  }
}
