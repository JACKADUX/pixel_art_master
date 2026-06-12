import type { ITool, Point, ToolContext } from "./ITool";

function setPixel(ctx: ToolContext, x: number, y: number): void {
  ctx.grid.setPixel(x, y, ctx.color);
}

function drawLine(ctx: ToolContext, x0: number, y0: number, x1: number, y1: number): void {
  let dx = Math.abs(x1 - x0);
  let dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  let x = x0;
  let y = y0;

  while (true) {
    setPixel(ctx, x, y);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
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
  const cx = Math.round((x0 + x1) / 2);
  const cy = Math.round((y0 + y1) / 2);
  const rx = Math.abs(x1 - x0) / 2;
  const ry = Math.abs(y1 - y0) / 2;
  if (rx === 0 && ry === 0) {
    setPixel(ctx, cx, cy);
    return;
  }

  const minX = Math.min(x0, x1);
  const maxX = Math.max(x0, x1);
  const minY = Math.min(y0, y1);
  const maxY = Math.max(y0, y1);

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const nx = rx === 0 ? 0 : (x - cx) / rx;
      const ny = ry === 0 ? 0 : (y - cy) / ry;
      const inside = nx * nx + ny * ny <= 1;
      if (filled ? inside : Math.abs(nx * nx + ny * ny - 1) < 0.15 / Math.min(rx || 1, ry || 1)) {
        setPixel(ctx, x, y);
      }
    }
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
    this.drawShape(ctx, this.startPoint, to);
  }

  onPointerUp(ctx: ToolContext, from: Point, to: Point): void {
    if (this.snapshot) {
      ctx.grid.restoreFrom(this.snapshot);
    }
    this.drawShape(ctx, from, to);
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
