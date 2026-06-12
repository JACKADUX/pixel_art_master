import { paintBrushAt, paintBrushSegment } from "./BrushStroke";
import type { ITool, Point, ToolContext } from "./ITool";
import { PixelPerfectStrokeSession } from "./PixelPerfectStroke";

export class BrushTool implements ITool {
  readonly name = "画笔";
  private readonly session = new PixelPerfectStrokeSession();

  onPointerDown(ctx: ToolContext, point: Point): void {
    this.session.reset();
    paintBrushAt(ctx, point, this.session);
  }

  onPointerMove(ctx: ToolContext, from: Point, to: Point): void {
    paintBrushSegment(ctx, from, to, this.session);
  }

  onPointerUp(): void {
    this.session.reset();
  }
}
