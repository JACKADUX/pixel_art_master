import { describe, expect, it } from "vitest";
import { createEmptyProject, getActiveCanvas } from "./Project";

describe("createEmptyProject", () => {
  it("uses default 64x64 when size is omitted", () => {
    const project = createEmptyProject("test");
    const canvas = getActiveCanvas(project);
    expect(canvas.width).toBe(64);
    expect(canvas.height).toBe(64);
  });

  it("uses provided canvas size", () => {
    const project = createEmptyProject("test", { width: 128, height: 96 });
    const canvas = getActiveCanvas(project);
    expect(canvas.width).toBe(128);
    expect(canvas.height).toBe(96);
    const drawingLayer = canvas.layers.find((layer) => layer.type === "drawing");
    expect(drawingLayer?.type === "drawing" ? drawingLayer.pixels.length : 0).toBe(128 * 96);
  });
});
