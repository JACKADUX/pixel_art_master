import {
  stampPatternAt,
  stampPatternSegment,
  type PatternStampOptions,
} from "@/domain/patternBrush/PatternBrushStamp";
import { paintBrushAt, paintBrushSegment } from "./BrushStroke";
import type { ITool, Point, ToolContext } from "./ITool";
import { PixelPerfectStrokeSession } from "./PixelPerfectStroke";

function buildPatternStampOptions(ctx: ToolContext): PatternStampOptions | null {
  if (!ctx.patternStamp) return null;
  return {
    source: ctx.patternStamp.source,
    scalePercent: ctx.settings.patternBrushScale,
    drawMode: ctx.patternStamp.drawMode,
    foregroundColor: ctx.patternStamp.foregroundColor,
    backgroundColor: ctx.patternStamp.backgroundColor,
    applyForegroundTint: ctx.patternStamp.applyForegroundTint,
  };
}

export class BrushTool implements ITool {
  readonly name = "画笔";
  private readonly session = new PixelPerfectStrokeSession();

  onPointerDown(ctx: ToolContext, point: Point): void {
    this.session.reset();
    if (ctx.settings.brushShape === "pattern") {
      const options = buildPatternStampOptions(ctx);
      if (options) {
        stampPatternAt(ctx.grid, point, options);
      }
      return;
    }
    paintBrushAt(ctx, point, this.session);
  }

  onPointerMove(ctx: ToolContext, from: Point, to: Point): void {
    if (ctx.settings.brushShape === "pattern") {
      const options = buildPatternStampOptions(ctx);
      if (options) {
        stampPatternSegment(ctx.grid, from, to, options);
      }
      return;
    }
    paintBrushSegment(ctx, from, to, this.session);
  }

  onPointerUp(): void {
    this.session.reset();
  }
}
