import { describe, expect, it } from "vitest";
import { rgba } from "@/domain/canvas/PixelColor";
import {
  createDrawingLayerClipboard,
  toPastedLayer,
} from "./DrawingLayerClipboard";
import {
  canMergeDrawingLayerDown,
  mergeDrawingLayerDown,
} from "./DrawingLayerMerge";
import { createEmptyDrawingLayer } from "./Layer";

describe("DrawingLayerClipboard", () => {
  it("creates a deep copy and produces a pasted layer with new id and name", () => {
    const source = createEmptyDrawingLayer({ width: 2, height: 2 }, "绘制层");
    source.pixels[0] = rgba(255, 0, 0, 255);

    const clipboard = createDrawingLayerClipboard(source, "canvas-a");
    const pasted = toPastedLayer(clipboard);

    expect(clipboard.layer.id).toBe(source.id);
    expect(clipboard.sourceCanvasId).toBe("canvas-a");
    expect(pasted.id).not.toBe(source.id);
    expect(pasted.name).toBe("绘制层 副本");
    expect(pasted.pixels[0]).toBe(rgba(255, 0, 0, 255));
    expect(pasted.locked).toBe(false);
    source.pixels[0] = 0;
    expect(clipboard.layer.pixels[0]).toBe(rgba(255, 0, 0, 255));
  });
});

describe("mergeDrawingLayerDown", () => {
  it("composites upper pixels onto the layer below", () => {
    const lower = createEmptyDrawingLayer({ width: 4, height: 4 }, "lower");
    const upper = createEmptyDrawingLayer({ width: 4, height: 4 }, "upper");
    lower.pixels[0] = rgba(255, 0, 0, 255);
    upper.pixels[5] = rgba(0, 0, 255, 255);

    const result = mergeDrawingLayerDown([lower, upper], upper.id);

    expect(result).not.toBeNull();
    expect(result!.layers).toHaveLength(1);
    expect(result!.activeLayerId).toBe(lower.id);
    const merged = result!.layers[0];
    expect(merged.type).toBe("drawing");
    if (merged.type === "drawing") {
      expect(merged.pixels[0]).toBe(rgba(255, 0, 0, 255));
      expect(merged.pixels[5]).toBe(rgba(0, 0, 255, 255));
    }
  });

  it("applies upper layer opacity when compositing", () => {
    const lower = createEmptyDrawingLayer({ width: 2, height: 2 }, "lower");
    const upper = createEmptyDrawingLayer({ width: 2, height: 2 }, "upper");
    lower.pixels[0] = rgba(0, 0, 0, 0);
    upper.pixels[0] = rgba(255, 0, 0, 255);
    upper.opacity = 128;

    const result = mergeDrawingLayerDown([lower, upper], upper.id);
    expect(result).not.toBeNull();
    const merged = result!.layers[0];
    expect(merged.type).toBe("drawing");
    if (merged.type === "drawing") {
      const alpha = (merged.pixels[0] >>> 24) & 0xff;
      expect(alpha).toBe(128);
    }
  });

  it("expands the lower layer when upper extends beyond its bounds", () => {
    const lower = createEmptyDrawingLayer({ width: 2, height: 2 }, "lower", { x: 0, y: 0 });
    const upper = createEmptyDrawingLayer({ width: 2, height: 2 }, "upper", { x: 3, y: 0 });
    upper.pixels[0] = rgba(0, 255, 0, 255);

    const result = mergeDrawingLayerDown([lower, upper], upper.id);

    expect(result).not.toBeNull();
    const merged = result!.layers[0];
    expect(merged.type).toBe("drawing");
    if (merged.type === "drawing") {
      expect(merged.width).toBeGreaterThanOrEqual(5);
      expect(merged.pixels[3]).toBe(rgba(0, 255, 0, 255));
    }
  });

  it("returns null for the bottom layer", () => {
    const lower = createEmptyDrawingLayer({ width: 2, height: 2 }, "lower");
    expect(canMergeDrawingLayerDown([lower], lower.id)).toBe(false);
    expect(mergeDrawingLayerDown([lower], lower.id)).toBeNull();
  });

  it("returns null when either layer is locked", () => {
    const lower = createEmptyDrawingLayer({ width: 2, height: 2 }, "lower");
    const upper = createEmptyDrawingLayer({ width: 2, height: 2 }, "upper");
    lower.locked = true;
    expect(canMergeDrawingLayerDown([lower, upper], upper.id)).toBe(false);
    expect(mergeDrawingLayerDown([lower, upper], upper.id)).toBeNull();

    lower.locked = false;
    upper.locked = true;
    expect(canMergeDrawingLayerDown([lower, upper], upper.id)).toBe(false);
    expect(mergeDrawingLayerDown([lower, upper], upper.id)).toBeNull();
  });

  it("removes the upper layer after merge", () => {
    const lower = createEmptyDrawingLayer({ width: 2, height: 2 }, "lower");
    const upper = createEmptyDrawingLayer({ width: 2, height: 2 }, "upper");
    const result = mergeDrawingLayerDown([lower, upper], upper.id);

    expect(result!.layers.some((layer) => layer.id === upper.id)).toBe(false);
    expect(result!.layers.some((layer) => layer.id === lower.id)).toBe(true);
  });
});
