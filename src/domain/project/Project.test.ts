import { describe, expect, it } from "vitest";
import { createEmptyProject } from "./Project";

describe("createEmptyProject", () => {
  it("uses default 64x64 when size is omitted", () => {
    const project = createEmptyProject("test");
    expect(project.canvas.width).toBe(64);
    expect(project.canvas.height).toBe(64);
  });

  it("uses provided canvas size", () => {
    const project = createEmptyProject("test", { width: 128, height: 96 });
    expect(project.canvas.width).toBe(128);
    expect(project.canvas.height).toBe(96);
    const drawingLayer = project.canvas.layers.find((layer) => layer.type === "drawing");
    expect(drawingLayer?.type === "drawing" ? drawingLayer.pixels.length : 0).toBe(128 * 96);
  });
});
