import { describe, expect, it } from "vitest";
import { rgba } from "@/domain/canvas/PixelColor";
import { createEmptyDrawingLayer } from "./Layer";
import { compositeDrawingLayers } from "./LayerCompositor";

describe("compositeDrawingLayers layer opacity", () => {
  it("multiplies pixel alpha by layer opacity at composite time", () => {
    const layer = createEmptyDrawingLayer({ width: 2, height: 2 });
    layer.pixels[0] = rgba(255, 0, 0, 255);
    layer.opacity = 128;

    const composite = compositeDrawingLayers([layer], { width: 2, height: 2 });
    const pixel = composite.getPixel(0, 0);

    expect((pixel >>> 24) & 0xff).toBe(128);
    expect(pixel & 0xff).toBe(255);
  });

  it("skips fully transparent result when layer opacity is zero", () => {
    const layer = createEmptyDrawingLayer({ width: 2, height: 2 });
    layer.pixels[0] = rgba(255, 0, 0, 255);
    layer.opacity = 0;

    const composite = compositeDrawingLayers([layer], { width: 2, height: 2 });
    expect(composite.getPixel(0, 0)).toBe(0);
  });
});
